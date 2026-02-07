import LoadBalancer from "./LoadBalancer.js";

export default class LeastConnectionBalancer extends LoadBalancer {
  public getNextServer(): string | null {
    if (!this.servers || this.servers.length === 0) {
      return null;
    }
    let leastConnectedServer = this.servers[0]!;

    for (const server of this.servers) {
      if (server.activeConnections < leastConnectedServer.activeConnections) {
        leastConnectedServer = server;
      }
    }
    this.incrementConnection(leastConnectedServer.address);
    return leastConnectedServer.address;
  }
}
