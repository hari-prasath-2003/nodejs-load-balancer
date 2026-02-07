import LoadBalancer from "./LoadBalancer.js";

export default class RoundRobinBalancer extends LoadBalancer {
  private currentIndex: number = 0;

  protected handleServerUpdate(message: string): void {
    super.handleServerUpdate(message);
    if (this.currentIndex >= this.servers.length) {
      this.currentIndex = 0;
    }
  }

  public getNextServer(): string | null {
    if (!this.servers || this.servers.length === 0) {
      return null;
    }

    const server = this.servers[this.currentIndex]!;

    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    this.incrementConnection(server.address);
    return server.address;
  }
}
