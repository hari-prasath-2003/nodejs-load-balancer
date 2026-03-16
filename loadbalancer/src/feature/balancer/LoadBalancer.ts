import logger from "@/infra/log/Logger.js";
import type CacheManager from "@/interface/CacheManager.js";
import type { BackendEndpointAddedEvent } from "@/interface/BackendEndpointAddedEvent.js";
import type { BackendPoolMap } from "@/interface/BackendPoolMap.js";

export default abstract class LoadBalancer {
  constructor(readonly backendPools: BackendPoolMap) {}

  // protected onBackendPoolUpdated(payload: BackendEndpointAddedEvent) {
  //   const { path, address } = payload;

  //   const existing = this.backendPools[path] ?? [];

  //   if (existing.some((s) => s.address === address)) {
  //     return;
  //   }

  //   this.backendPools = {
  //     ...this.backendPools,
  //     [path]: [...existing, { address, activeConnections: 0, isActive: false }],
  //   };
  // }

  public decrementConnection(path: string, address: string): void {
    const backendPools = this.backendPools[path];
    if (!backendPools) {
      logger.error(`No path exist on the name ${path}`);
      return;
    }
    const server = backendPools.find((s) => s.address === address);
    if (server && server.activeConnections > 0) {
      server.activeConnections--;
    }
  }

  public incrementConnection(path: string, address: string): void {
    const backendPools = this.backendPools[path];
    if (!backendPools) {
      logger.error(`No path exist on the name ${path}`);
      return;
    }
    const server = backendPools.find((s) => s.address === address);
    if (server) {
      server.activeConnections++;
    }
  }

  public abstract getNextServer(path: string): string | null;

  private markServerUnhealthy(path: string, address: string) {
    const serverList = this.backendPools[path] ?? [];

    serverList.map((server) => {
      if (server.address === address) {
        return { ...server, isActive: false };
      } else {
        return { ...server };
      }
    });
  }
}
