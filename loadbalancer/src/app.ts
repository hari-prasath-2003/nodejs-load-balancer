import "dotenv/config";

import cluster from "cluster";
import os from "os";
import logger from "./infra/log/Logger.js";
import { pid } from "process";
import createWorker from "./server.js";
import RoundRobinBalancer from "./feature/balancer/RoundRobin.js";
import { RedisCacheManager } from "./infra/cache/RedisCacheManager.js";

const NUM_CPUs = os.cpus().length;

if (cluster.isPrimary) {
  logger.info({ pid: pid }, "Master process is running");
  logger.info(`Forking for ${NUM_CPUs} cpus..`);
  for (let i = 1; i <= NUM_CPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    logger.info(`Worker ${worker.process.pid} died. Starting a new one...`);
    cluster.fork();
  });
} else {
  const cacheManager = new RedisCacheManager();
  const defaultLoadBalancer = new RoundRobinBalancer(cacheManager);
  const worker = new createWorker(defaultLoadBalancer, cacheManager);

  worker.start();
}
