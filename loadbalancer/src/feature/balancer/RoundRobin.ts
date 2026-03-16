import type { BackendEndpointAddedEvent } from "@/interface/BackendEndpointAddedEvent.js";
import LoadBalancer from "./LoadBalancer.js";
import logger from "@/infra/log/Logger.js";

export default class RoundRobinBalancer extends LoadBalancer {
  private rrIndexByPath: Record<string, number> = {};

  // protected onBackendPoolUpdated(payload: BackendEndpointAddedEvent): void {
  //   super.onBackendPoolUpdated(payload);
  //   const { path, address } = payload;
  //   const pool = this.backendPools[path] ?? [];
  //   const index = this.rrIndexByPath[path] ?? 0;

  //   if (index >= pool.length) {
  //     this.rrIndexByPath[path] = 0;
  //   }
  // }

  public getNextServer(path: string): string | null {
    const pool = this.backendPools[path];

    if (!pool || pool.length === 0) {
      return null;
    }

    const index = this.rrIndexByPath[path] ?? 0;
    const server = pool[index]!;

    this.rrIndexByPath[path] = (index + 1) % pool.length;

    this.incrementConnection(path, server.address);
    return server.address;
  }
}
