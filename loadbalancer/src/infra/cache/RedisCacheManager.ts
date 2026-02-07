import type CacheManager from "@/interface/CacheManager.js";
import { Redis } from "ioredis";

export class RedisCacheManager implements CacheManager<string, string> {
  private commandClient = new Redis("redis_container:6379");

  private subscriberClient = new Redis("redis_container:6379");

  async get(key: string): Promise<string | null> {
    const value = await this.commandClient.get(key);
    if (!value) return null;

    return JSON.parse(value);
  }

  put(key: string, value: string, ttl?: number): void {
    const stringifiedValue = JSON.stringify(value);
    if (ttl) {
      this.commandClient.set(key, stringifiedValue, "EX", ttl);
    } else {
      this.commandClient.set(key, stringifiedValue);
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
    await this.subscriberClient.unsubscribe("server-updates");
  }
}
