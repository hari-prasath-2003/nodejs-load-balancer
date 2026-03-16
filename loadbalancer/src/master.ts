import "dotenv/config";

import cluster from "cluster";
import os from "os";
import logger from "./infra/log/Logger.js";
import { pid } from "process";
import Worker from "./worker.js";
import { RedisCacheManager } from "./infra/cache/RedisCacheManager.js";
import type { BackendEndpointAddedEvent } from "./interface/BackendEndpointAddedEvent.js";
import type { ClusterMessage } from "./interface/ClusterMessage.js";
import type { BackendPoolMap } from "./interface/BackendPoolMap.js";
import { type LoadBalancerAlgorithms } from "./interface/LoadBalancerAlgorithms.js";
import type { BackendNode } from "./interface/BackendNode.js";
import { isValidLBAlgorithm } from "./utils/validTypeCheck.js";

const NUM_CPUs = os.cpus().length;
const MAX_WORKER_RESTART = 2;
const WORKER_FAILURE_WINDOW_MS = 10_000;
let currentAlgorithm: LoadBalancerAlgorithms = "round-robin";
let restartCount = 0;
let windowStartTime = Date.now();
const workers: cluster.Worker[] = new Array(NUM_CPUs) as cluster.Worker[];
const cacheManager = new RedisCacheManager();
let backendPool: BackendPoolMap = {};

if (cluster.isPrimary) {
  logger.info({ pid: pid }, "Master process is running");
  logger.info(`Forking for ${NUM_CPUs} cpus..`);
  backendPool = await getUpstreamServicePool();
  for (let i = 0; i < NUM_CPUs; i++) {
    const worker = cluster.fork();
    workers[i] = worker;

    await notifyWorkerCurrentConfig(worker);
  }
  cluster.on("exit", async (worker, code, signal) => {
    const now = Date.now();

    if (now - windowStartTime > WORKER_FAILURE_WINDOW_MS) {
      restartCount = 0;
      windowStartTime = Date.now();
    }

    restartCount++;

    logger.error(`Worker ${worker.process.pid} died`);

    if (restartCount > MAX_WORKER_RESTART) {
      logger.fatal("Too many worker crashes. Shutting down master process.");
      process.exit(1);
    }

    const newWorker = cluster.fork();
    await notifyWorkerCurrentConfig(newWorker);
  });

  cacheManager.subscribe("server-updates", (message: string) => {
    const payload = JSON.parse(message) as BackendEndpointAddedEvent;
  });

  setInterval(async () => {
    const newAlgorithm = await cacheManager.get("loadbalancer-algorithm");
    if (!isValidLBAlgorithm(newAlgorithm)) {
      logger.warn(`Unknown algorithm, keeping current ${currentAlgorithm}`);
      return;
    }
    if (newAlgorithm === currentAlgorithm) return;
    for (let i = 0; i < workers.length; i++) {
      await NotifyWorkerLBAlgorithm(workers[i]!, newAlgorithm);
    }
  }, 10000);
} else {
  const worker = new Worker();
}

async function getUpstreamServicePool(): Promise<BackendPoolMap> {
  logger.info("loading upstream server pool entries from store");
  const activePaths = await cacheManager.getSetMembers(
    "active-backendPools-path",
  );

  const entries = await Promise.all(
    activePaths.map(async (path) => {
      const serverIds = await cacheManager.getSetMembers(path);

      const backendNodes = (
        await Promise.all(
          serverIds.map(async (serverId) => {
            const server = await cacheManager.getHashMap(serverId);
            if (!server || !server.address) {
              logger.warn(
                `Invalid or missing server config for ID "${serverId}" under path "${path}"`,
              );
              return null;
            }
            return {
              id: serverId,
              address: server.address,
              activeConnections: 0,
              isActive: false,
            };
          }),
        )
      ).filter(
        (backendNode): backendNode is BackendNode => backendNode !== null,
      );

      return [path, backendNodes] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function notifyWorkerCurrentConfig(worker: cluster.Worker) {
  const inital_routing_config_event: ClusterMessage = {
    from: "MASTER",
    type: "INIT_ROUTING_CONFIG",
    backendPool,
    loabBalancerAlgorithm: currentAlgorithm,
  };

  worker.send(inital_routing_config_event);
}

async function NotifyWorkerLBAlgorithm(
  worker: cluster.Worker,
  newAlgorithm: LoadBalancerAlgorithms,
) {
  logger.info(
    `Switching Algorithm from ${currentAlgorithm} to ${newAlgorithm}`,
  );

  const algorithmChangeEvent: ClusterMessage = {
    from: "MASTER",
    type: "UPDATE_LB_ALGORITHM",
    newAlgorithm: newAlgorithm,
  };

  worker.send(algorithmChangeEvent);
  currentAlgorithm = newAlgorithm;
}
