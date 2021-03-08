import {ApplicationConfig} from '@loopback/core';
import path from 'path';
import {LocalDeployApplication} from './local';
import {ExpressServer} from './server';
export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(
    new LocalDeployApplication(options),
    path.join(__dirname, '..'),
  );
  await server.boot();
  await server.start();
  console.log('Server is running');
}
