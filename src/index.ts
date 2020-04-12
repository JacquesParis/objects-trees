import {ApplicationConfig} from '@loopback/core';
import {ObjectstreesApplication} from './application';
import {ExpressServer} from './server';

export {ObjectstreesApplication};

export async function main(options: ApplicationConfig = {}) {
  /*
  const app = new ObjectstreesApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
  */

  const server = new ExpressServer(options);
  await server.boot();
  await server.start();
  console.log('Server is running at http://127.0.0.1:3000');
}
