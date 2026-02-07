import logger from "@/infra/log/Logger.js";
import type CacheManager from "@/interface/CacheManager.js";
import type { ServerInfo } from "@/interface/ServerInfo.js";

export default abstract class LoadBalancer {
  private cacheManager: CacheManager<string, string>;
  protected servers: ServerInfo[];

  constructor(cacheManager: CacheManager<string, string>) {
    this.cacheManager = cacheManager;
    this.servers = [];

    this.cacheManager.subscribe(
      "server-updates",
      this.handleServerUpdate.bind(this),
    );

    this.initializeServers();
  }

  private async initializeServers() {
    const currentList = await this.cacheManager.get("active-servers-list");
    if (currentList) {
      this.handleServerUpdate(currentList);
    }
  }

  protected handleServerUpdate(message: string): void {
    logger.info(`Updating server list: ${message}`);
    const incommingAddress = message.split(",");

    const existingAddresses = this.servers.map((s) => s.address);

    const filteredAddresses = incommingAddress.filter(
      (addr) => !existingAddresses.includes(addr),
    );
    const newServers = filteredAddresses.map((server) => ({
      address: server,
      activeConnections: 0,
    }));
    this.servers = [...this.servers, ...newServers];
  }

  public decrementConnection(address: string): void {
    const server = this.servers.find((s) => s.address === address);
    if (server && server.activeConnections > 0) {
      server.activeConnections--;
    }
  }

  public incrementConnection(address: string): void {
    const server = this.servers.find((s) => s.address === address);
    if (server) {
      server.activeConnections++;
    }
  }

  public abstract getNextServer(): string | null;

  public destroy(): void {
    this.cacheManager.disconnect();
  }
}
