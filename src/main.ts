import {ApplicationConfig} from '@loopback/core';
import {LocalDeployApplication} from './local';
import {ExpressServer} from './server';
export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(
    new LocalDeployApplication(options),
    options,
  );
  await server.boot();
  await server.start();
  console.log('Server is running at http://127.0.0.1:3000');
}
