import http from 'http';
import app from './www';

let server: http.Server;

function initialize(config: { port: number }) {
  server = http.createServer(app);
  server.listen(config.port);
}

export default {
  initialize: initialize,
  getInstance: () => (server),
};
