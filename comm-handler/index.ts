import { Socket, Server } from 'socket.io';
import { IHandler } from '../comm';
import test from './test';
import auth from './auth';

export default {
  rules: {
    ...test.rules,
    ...auth.rules,
  },
  handler(socket: Socket, io: Server) {
    test.handler(io, socket);
    auth.handler(io, socket);
  },
} as IHandler;
