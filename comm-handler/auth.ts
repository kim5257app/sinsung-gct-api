import { Socket, Server } from 'socket.io';
import { makeHandler } from '../comm/helper';
import { verifyToken } from '../firebase/auth';

export default {
  rules: {
    'auth.verify': {
      token: { type: 'string' },
    },
  },
  handler(io: Server, socket: Socket) {
    makeHandler(socket, 'auth.verify', async (payload, resp) => {
      try {
        const userInfo = await verifyToken(payload.token);

        console.log('userInfo:', JSON.stringify(userInfo));
        await socket.set('userInfo', userInfo);

        // uid를 사용한 개인채널 생성
        socket.join(`user:${userInfo.uid}`);

        resp({
          result: 'success',
        });
      } catch (error: any) {
        resp({
          result: 'error',
          code: error.code,
          name: error.name,
          message: error.message,
        });
      }
    });
  },
}
