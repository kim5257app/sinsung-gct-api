import { Socket, Server } from 'socket.io';
import { makeHandler } from '../comm/helper';
import { verifyToken, getUser } from '../firebase/auth';
import db from '../db';
import dbQuery from '../db-query';
import { Error } from '../debug/error';

export default {
  rules: {
    'users.update': {
      name: { type: 'string', minLen: 1, maxLen: 16, required: false },
    },
    'users.verify': {
      token: { type: 'string' },
    },
  },
  handler(io: Server, socket: Socket) {
    makeHandler(socket, 'users.update', async (payload, resp) => {
      const userInfo = await socket.get('userInfo');
      if (userInfo == null) {
        Error.makeThrow({
          name: 'ACCESS_DENIED',
          message: 'Access denied',
        });
      }

      await db.getInstance()
        .query(dbQuery.users.updateUser({
          ...payload,
          id: userInfo!.id,
        }));

      // 소켓 연결 정보 업데이트
      await socket.set('info', {
        ...payload,
        name: payload.name,
      });

      resp({ result: 'success' });
    });

    makeHandler(socket, 'users.verify', async (payload, resp) => {
      const firebaseInfo = await verifyToken(payload.token);
      const firebaseProfile = await getUser(firebaseInfo.uid);

      let [item] = await db.getInstance()
        .query(dbQuery.users.getUserList({
          filters: [{ condition: 'eq', column: 'id', value: firebaseInfo.uid }],
        }));

      if (item == null) {
        // GCT 사용자 정보 추가
        await db.getInstance()
          .query(dbQuery.users.addUser({
            id: firebaseInfo.uid,
            name: firebaseProfile.displayName,
          }));

        // GCT 사용자 정보 가져오기
        const newItems = await db.getInstance()
          .query(dbQuery.users.getUserList({
            filters: [{ condition: 'eq', column: 'id', value: firebaseInfo.uid }],
          }));

        item = newItems[0];
      }

      const userInfo = {
        ...item,
        firebaseInfo,
      }

      console.log('userInfo:', JSON.stringify(userInfo));
      await socket.set('userInfo', userInfo);

      // uid를 사용한 개인채널 생성
      socket.join(`user:${userInfo.id}`);

      resp({
        result: 'success',
        item: userInfo,
      });
    });
  },
}
