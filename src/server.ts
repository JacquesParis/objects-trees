import {RestApplication} from '@loopback/rest';
import express from 'express';
import {Server} from 'http';
import pEvent from 'p-event';
import path from 'path';
import {ObjectTreesApplicationInterface} from './application';

export class ExpressServer {
  private app: express.Application;
  private lbApp: ObjectTreesApplicationInterface;
  private server: Server;

  constructor(restApp: RestApplication, rootDirectory: string) {
    this.app = express();
    this.lbApp = (restApp as unknown) as ObjectTreesApplicationInterface;
    this.app.use('/api', this.lbApp.requestHandler);

    this.initApplication(this.lbApp);

    // Serve static files in the public folder
    this.app.use(express.static('public'));
    this.app.use(
      '/admin',
      express.static(
        path.join(rootDirectory, 'node_modules/@jacquesparis/objects-angular'),
      ),
    );
    this.app.use(
      '/objectsites',
      express.static(
        path.join(
          rootDirectory,
          'node_modules/@jacquesparis/objects-angular/objectsites',
        ),
      ),
    );
  }

  public static(basePath: string, dirName: string) {
    this.app.use(basePath, express.static(dirName));
  }

  async boot() {
    await this.lbApp.boot();
    await this.lbApp.bootObjectTrees();
    await this.bootApplication(this.lbApp);
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port || 3000;
    const host = this.lbApp.restServer.config.host
      ? this.lbApp.restServer.config.host
      : '127.0.0.1';
    this.server = this.app.listen(port, host);
    console.log('listening', host, port);
    await pEvent(this.server, 'listening');
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = (null as unknown) as Server;
  }

  protected initApplication(app: ObjectTreesApplicationInterface) {
    return;
  }

  protected async bootApplication(app: ObjectTreesApplicationInterface) {
    return;
  }
}
