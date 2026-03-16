import type CacheManager from "@/interface/CacheManager.js";
import { Redis } from "ioredis";

export class RedisCacheManager implements CacheManager<string, string> {
  private commandClient: Redis;
  private subscriberClient: Redis;

  constructor() {
    this.commandClient = new Redis("redis_container:6379");
    this.subscriberClient = new Redis("redis_container:6379");
  }

  async get(key: string): Promise<string | null> {
    return this.commandClient.get(key);
  }

  async getSetMembers(key: string): Promise<string[]> {
    return this.commandClient.smembers(key);
  }

  async getHashMap(key: string): Promise<Record<string, string>> {
    return this.commandClient.hgetall(key);
  }

  put(key: string, value: string, ttl?: number): void {
    if (ttl) {
      this.commandClient.set(key, value, "EX", ttl);
    } else {
      this.commandClient.set(key, value);
    }
  }

  delete(key: string): void {
    this.commandClient.del(key);
  }

  clear(): void {
    this.commandClient.flushdb();
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.commandClient.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.subscriberClient.subscribe(channel);

    this.subscriberClient.on("message", (incomingChannel, message) => {
      if (incomingChannel === channel) {
        callback(message);
      }
    });
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.commandClient.quit(),
      this.subscriberClient.quit(),
    ]);
  }
}
