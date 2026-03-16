import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import httpProxy from "http-proxy";
import logger from "./infra/log/Logger.js";
import { pid } from "process";
import RoundRobinBalancer from "./feature/balancer/RoundRobin.js";
import LeastConnectionBalancer from "./feature/balancer/LeastConnection.js";
import HttpLogger from "./infra/log/HttpLogger.js";
import LoadBalancer from "./feature/balancer/LoadBalancer.js";
import type { LoadBalancerAlgorithms } from "./interface/LoadBalancerAlgorithms.js";
import type { ClusterMessage } from "./interface/ClusterMessage.js";
import type { BackendPoolMap } from "./interface/BackendPoolMap.js";
import { isClusterMessage } from "./utils/validTypeCheck.js";

const PORT = parseInt(process.env.SERVER_PORT || "3000");

export default class Worker {
  private app: Express;
  private loadBalancer: LoadBalancer = new RoundRobinBalancer({});
  private proxy: httpProxy;
  private currentAlgorithmName: LoadBalancerAlgorithms = "round-robin";
  private upstreamServerPool: BackendPoolMap = {};

  constructor() {
    process.on("message", (message: unknown) => {
      if (isClusterMessage(message)) {
        const ipcMessage = message as ClusterMessage;
        try {
          switch (ipcMessage.type) {
            case "INIT_ROUTING_CONFIG":
              this.upstreamServerPool = ipcMessage.backendPool;
              this.SetLBAlgorithm(ipcMessage.loabBalancerAlgorithm);
              this.start();
              break;
            case "UPDATE_LB_ALGORITHM":
              this.SetLBAlgorithm(ipcMessage.newAlgorithm);
              break;
          }
        } catch (error: any) {
          logger.error(
            `caught ${error.message} while handling message type ${ipcMessage.type}`,
          );
          process.exit(1);
        }
      }
    });
    this.app = express();

    this.proxy = httpProxy.createProxyServer();

    this.proxy.on("error", (err: Error, req: any, res: any) => {
      logger.error(err, "Proxy failed");

      res.statusCode = 500;
      res.end("Proxy Error");
    });

    this.app.use(express.json());
    this.app.use(HttpLogger);

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const segments = req.path.split("/").filter(Boolean);
      const firstSegment = segments[0];
      const path = firstSegment ? `/${firstSegment}` : "/";
      const targetServer = this.loadBalancer.getNextServer(path);

      if (!targetServer) {
        logger.error(`No available target servers for ${path}`);
        return res.status(503).send("Service Unavailable");
      }
      res.on("finish", async () => {
        this.loadBalancer.decrementConnection(path, targetServer!);
      });

      try {
        this.proxy.web(req, res, {
          prependPath: false,
          changeOrigin: true,
          target: `http://${targetServer}`,
          xfwd: true,
        });
      } catch (err) {
        logger.error(err as Error, "Proxy failed");
        if (!res.headersSent) {
          res.status(500).send("Proxy Error");
        }
      }
    });
  }

  public start() {
    this.app.listen(PORT, () => {
      logger.info(
        { port: PORT },
        `Worker Server PID : ${pid} Started with config loadbalancer : ${this.currentAlgorithmName}`,
      );
    });
  }

  private async SetLBAlgorithm(newAlgorithm: LoadBalancerAlgorithms) {
    switch (newAlgorithm) {
      case "round-robin":
        this.loadBalancer = new RoundRobinBalancer(this.upstreamServerPool);
        break;
      case "least-connections":
        this.loadBalancer = new LeastConnectionBalancer(
          this.upstreamServerPool,
        );
        break;
    }

    this.currentAlgorithmName = newAlgorithm;
  }
}
