import { scheduleJob } from 'node-schedule';

export default {
  initialize() {
    // APP 위치 정보 요청 스케줄
    scheduleJob('* * 1 * * *', () => {
    });
  }
}

