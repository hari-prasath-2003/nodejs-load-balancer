import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import httpProxy from "http-proxy";
import logger from "./infra/log/Logger.js";
import { pid } from "process";
import type CacheManager from "./interface/CacheManager.js";
import RoundRobinBalancer from "./feature/balancer/RoundRobin.js";
import LeastConnectionBalancer from "./feature/balancer/LeastConnection.js";
import HttpLogger from "./infra/log/HttpLogger.js";
import { RedisCacheManager } from "./infra/cache/RedisCacheManager.js";
import LoadBalancer from "./feature/balancer/LoadBalancer.js";

const PORT = parseInt(process.env.SERVER_PORT || "3000");

export default class createWorker {
  private app: Express;
  private loadBalancer: LoadBalancer;
  private cacheManager: CacheManager<string, string>;
  private proxy: httpProxy;
  private currentAlgorithmName: string = "RoundRobin";

  constructor(
    loadBalancer: LoadBalancer,
    cacheManager: CacheManager<string, string>,
  ) {
    this.loadBalancer = loadBalancer;
    this.cacheManager = cacheManager;
    this.app = express();

    this.proxy = httpProxy.createProxyServer({});

    this.proxy.on("error", (err: Error, req: any, res: any) => {
      logger.error(err, "Proxy failed");

      res.statusCode = 500;
      res.end("Proxy Error");
    });

    this.app.use(express.json());
    this.app.use(HttpLogger);

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const targetServer = this.loadBalancer.getNextServer();

      if (targetServer) {
        this.proxy.web(req, res, { target: `http://${targetServer}` });
      } else {
        logger.error(`No available target servers`);
        res.status(503).send("Service Unavailable");
      }
      res.on("finish", async () => {
        this.loadBalancer.decrementConnection(targetServer!);
      });
    });
  }

  public start() {
    this.app.listen(PORT, () => {
      setInterval(() => {
        this.checkAndSwitchAlgorithm();
      }, 10000);

      logger.info({ port: PORT }, `Worker Server PID : ${pid} Started`);
    });
  }

  private async checkAndSwitchAlgorithm() {
    const newAlgorithm = await this.cacheManager.get("loadbalancer-algorithm");

    if (newAlgorithm && newAlgorithm !== this.currentAlgorithmName) {
      logger.info(
        `Switching Algorithm from ${this.currentAlgorithmName} to ${newAlgorithm}`,
      );

      if (this.loadBalancer.destroy) this.loadBalancer.destroy();

      const newCacheManager = new RedisCacheManager();

      switch (newAlgorithm) {
        case "RoundRobin":
          this.loadBalancer = new RoundRobinBalancer(newCacheManager);
          break;
        case "LeastConnection":
          this.loadBalancer = new LeastConnectionBalancer(newCacheManager);
          break;
        default:
          logger.warn("Unknown algorithm, keeping current");
          return;
      }

      this.currentAlgorithmName = newAlgorithm;
    }
  }
}
