import {ApplicationConfig} from '@loopback/core';
import express from 'express';
import {Server} from 'http';
import pEvent from 'p-event';
import {ObjectstreesApplication} from './application';

export class ExpressServer {
  private app: express.Application;
  private lbApp: ObjectstreesApplication;
  private server: Server;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new ObjectstreesApplication(options);
    this.app.use('/api', this.lbApp.requestHandler);

    // Serve static files in the public folder
    this.app.use(express.static('public'));
  }
  async boot() {
    await this.lbApp.boot();
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port || 3000;
    const host = this.lbApp.restServer.config.host || '127.0.0.1';
    this.server = this.app.listen(port, host);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = <any>null;
  }
}
