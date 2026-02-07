export default interface CacheManager<K, V> {
  get(key: K): Promise<V | null>;
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
