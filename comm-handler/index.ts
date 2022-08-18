import { Socket, Server } from 'socket.io';
import { IHandler } from '../comm';
import test from './test';
import users from './users';

export default {
  rules: {
    ...test.rules,
    ...users.rules,
  },
  handler(socket: Socket, io: Server) {
    test.handler(io, socket);
    users.handler(io, socket);
  },
} as IHandler;
