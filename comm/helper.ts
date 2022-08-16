import { Socket } from 'socket.io';
import { Error } from '../debug/error';

export function makeHandler(
  socket: Socket,
  eventName: string,
  cb: (...args: any[]) => void) {
  socket.on(eventName, async (payload, resp) => {
    try {
      await cb(payload, resp);
    } catch (error) {
      resp(Error.makeError(error));
    }
  });
}

export default {};
