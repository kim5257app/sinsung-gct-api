import http from 'http';
import { Server, Socket } from 'socket.io';
import RedisStore from '@socket.io/redis-adapter';
import { createClient, RedisClientOptions } from 'redis';
import Store from './store';
import { middleware as formMiddleware, IFormList } from './form-checker';
import { Error } from '../debug/error';
import log from '../debug/logger';

interface CommConfig {
  port?: number;
  server?: http.Server
  store?: RedisClientOptions;
  cluster?: RedisClientOptions;
}

export interface IHandler {
  rules: IFormList,
  handler: (socket: Socket, io: Server) => void;
}

export class Comm {
  static instance: Comm | undefined;

  static async initialize(config: CommConfig, handlers: IHandler): Promise<void> {
    Comm.instance = new Comm(config, handlers);

    if (config.store != null) {
      // Redis 저장소 설정
      const redisClient = createClient(config.store);
      await redisClient.connect();

      Comm.instance.server.use(Store.middleware(redisClient));
    }

    if (config.cluster != null) {
      // Cluster 설정
      const pubClient = createClient(config.cluster);
      const subClient = pubClient.duplicate();

      await pubClient.connect();
      await subClient.connect();

      Comm.instance.server.adapter(RedisStore.createAdapter(
        pubClient,
        subClient,
      ));
    }
  }

  public readonly server: Server
  private readonly handlers: IHandler;

  constructor(config: CommConfig, handlers: IHandler) {
    this.handlers = handlers;

    if (config.port != null) {
      this.server = new Server(config.port, {
        cors: {
          origin: '*',
        },
      });
    } else if (config.server != null) {
      this.server = new Server(config.server, {
        transports: ['websocket'],
        cors: {
          origin: '*',
        },
      });
    } else {
      throw Error.makeError({
        result: 'error',
        name: 'WRONG_ARGUMENT',
        message: 'Wrong Argument',
      });
    }

    this.server.use(formMiddleware(this.handlers.rules));

    this.server.on('connection', (socket: Socket) => {
      log.info(`New connection: ${socket.id}`);
      this.handlers.handler(socket, this.server);
    });
  }
}

export default {
  initialize: Comm.initialize,
  getInstance: () => (Comm.instance!),
}
