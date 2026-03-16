export default interface CacheManager<K = string, V = string> {
  get(key: K): Promise<V | null>;
  getSetMembers(key: K): Promise<V[]>;
  getHashMap(key: string): Promise<Record<string, string>>;
  put(key: K, value: V, ttl?: number): void;
  delete(key: K): void;
  clear(): void;
  publish(channel: string, message: string): Promise<number>;
  subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void>;
  disconnect(): void;
}
