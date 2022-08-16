import config from './config/config.json';
import web from './web';
import db from './db';
import comm from './comm';
import commHandler from './comm-handler';
import events from './event';
import schedule from './schedule';
import log from './debug/logger';
import './firebase/auth';

(async () => {
  try {
    log.info('Web initialize...');
    await web.initialize(config.comm);
    log.info('Web initialized');

    log.info('DB initialize...');
    await db.initialize(config.db);
    log.info('DB initialized');

    log.info('Comm initialize...');
    await comm.initialize({
      server: web.getInstance(),
      store: config.comm.store,
    }, commHandler);
    log.info('Comm initialized');

    log.info('Schedule initialize...');
    schedule.initialize();
    log.info('Schedule initialized');

    events.emit('initialized');
  } catch (error) {
    events.emit('error', error);
  }
})();

events.once('initialized', () => {
  log.info('All systems nominal');
});

events.once('error', (error) => {
  log.fatal('We got some problem!');
  log.fatal(error);
  process.exit(-1);
});
