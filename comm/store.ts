import { Socket } from 'socket.io';
import {
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules, RedisScripts
} from 'redis';

class Store {
  public static redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>;

  private readonly id: String;

  constructor(id: String) {
    this.id = id;
  }

  private makeStoreKey(key: String): string {
    return `socket.io-store:${this.id}:${key}`;
  }

  public async get(key: String): Promise<any | null> {
    const value = await Store.redisClient.get(this.makeStoreKey(key));
    return (value) ? JSON.parse(value) : value;
  }

  public async set(key: String, value: any): Promise<string | null> {
    return await Store.redisClient.set(
      this.makeStoreKey(key),
      JSON.stringify(value),
    );
  }

  public async del(key: String): Promise<number> {
    return await Store.redisClient.del(this.makeStoreKey(key));
  }

  public async  has(key: String): Promise<boolean> {
    const reply = await Store.redisClient.exists(this.makeStoreKey(key));
    return (reply > 0);
  }
}

declare module 'socket.io' {
  export class Socket {
    get: (key: String) => Promise<any | null>;
    set: (key: String, value: any) => Promise<string | null>;
    del: (key: String) => Promise<number>;
    has: (key: String) => Promise<boolean>;
  }
}

export default {
  middleware(redisClient: RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts>): (socket: Socket, next: (err?: Error) => void) => void {
    Store.redisClient = redisClient;

    return ((socket: Socket, next): void => {
      const store = new Store(socket.id);

      socket.get = (key: String) => (store.get(key));
      socket.set = (key: String, value: any) => (store.set(key, value));
      socket.del = (key: String) => (store.del(key));
      socket.has = (key: String) => (store.has(key));

      next();
    });
  }
}
