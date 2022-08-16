import { Socket, Server } from 'socket.io';
import { makeHandler } from '../comm/helper';

export default {
  rules: {
    'test.echo': {
      msg: { type: 'string', maxLen: 4096 },
    },
  },
  handler(io: Server, socket: Socket) {
    makeHandler(socket, 'test.echo', async (payload, resp) => {
      resp({
        result: 'success',
        msg: payload.msg,
      });
    });
  },
}
