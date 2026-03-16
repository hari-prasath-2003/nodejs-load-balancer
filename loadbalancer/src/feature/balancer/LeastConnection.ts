import LoadBalancer from "./LoadBalancer.js";

export default class LeastConnectionBalancer extends LoadBalancer {
  public getNextServer(path: string): string | null {
    const servers = this.backendPools[path];
    if (!servers || servers.length === 0) {
      return null;
    }
    let leastConnectedServer = servers[0]!;

    for (const server of servers) {
      if (server.activeConnections < leastConnectedServer.activeConnections) {
        leastConnectedServer = server;
      }
    }
    this.incrementConnection(path, leastConnectedServer.address);
    return leastConnectedServer.address;
  }
}
