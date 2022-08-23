import { Socket, Server } from 'socket.io';
import { makeHandler, isAuthorized } from '../comm/helper';
import { verifyToken, getUser } from '../firebase/auth';
import db from '../db';
import dbQuery from '../db-query';
import { Error } from '../debug/error';

export default {
  rules: {
    'rooms.add': {
      name: { type: 'string', minLen: 1, maxLen: 64 },
      public: { type: 'boolean' },
      write: { type: 'boolean' },
    },
    'rooms.update': {
      no: { type: 'number', min: 1 },
      name: { type: 'string', minLen: 1, maxLen: 64, required: false },
      public: { type: 'boolean', required: false },
      write: { type: 'boolean', required: false },
    },
    'rooms.list.get': {
    },
  },
  handler(io: Server, socket: Socket) {
    makeHandler(socket, 'rooms.add', async (payload, resp) => {
      const userInfo = await isAuthorized(socket);

      // 방 생성 권한 있는지 확인
      if (!userInfo.permission.manager) {
        Error.makeThrow({
          name: 'ACCESS_DENIED',
          message: 'Access denied',
        });
      }

      const transaction = await db.getInstance().beginTransaction();

      try {
        const { insertId } = await db.getInstance()
          .query(dbQuery.rooms.add(payload));

        const [item] = await db.getInstance()
          .query(dbQuery.rooms.getRoomList({
            filters: [{condition: 'eq', column: 'no', value: insertId}],
          }));

        await db.getInstance()
          .query(dbQuery.rooms.mappingUser({
            roomNo: insertId,
            id: userInfo.id,
            master: true,
            manager: true,
            write: true,
          }));

        await transaction.commit();

        resp({
          result: 'success',
          item,
        });
      } catch (error) {
        await transaction.rollback();

        Error.makeError(error);
      }
    });

    makeHandler(socket, 'rooms.update', async (payload, resp) => {
      const userInfo = await isAuthorized(socket);

      const items = await db.getInstance()
        .query(dbQuery.rooms.getRoomList({
          filters: [
            { condition: 'eq', column: 'id', value: userInfo.id },
            { where: 'and', condition: 'eq', column: 'disabled', value: false },
          ],
        }));

      resp({
        result: 'success',
        items,
      });

      // 각 방의 마지막 메시지 및 안 읽은 메시지 수를 구하여 추가 전송
    });

    makeHandler(socket, 'rooms.list.get', async (payload, resp) => {
      const userInfo = await isAuthorized(socket);

      const items = await db.getInstance()
        .query(dbQuery.rooms.getRoomList({
          filters: [{ condition: 'eq', column: 'id', value: userInfo.id }],
        }));

      resp({
        result: 'success',
        items,
      });
    });
  }
}
