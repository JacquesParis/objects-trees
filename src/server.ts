import {RestApplication} from '@loopback/rest';
import express from 'express';
import {Server} from 'http';
import pEvent from 'p-event';
import path from 'path';
import {ObjectTreesApplicationInterface} from './application.interface';

export class ExpressServer {
  private app: express.Application;
  private lbApp: ObjectTreesApplicationInterface;
  private server: Server;

  constructor(restApp: RestApplication, protected rootDirectory: string) {
    this.app = express();
    this.lbApp = (restApp as unknown) as ObjectTreesApplicationInterface;
    this.lbApp.addStaticDir = this.static.bind(this);
    this.lbApp.rootDirectory = rootDirectory;

    this.app.use('/api', this.lbApp.requestHandler);

    this.initApplication(this.lbApp);

    /*
    this.app.use(
      '/admin',
      express.static(
        path.join(rootDirectory, 'node_modules/@jacquesparis/objects-angular'),
      ),
    );*/
    this.app.use(
      '/objectsites',
      express.static(
        path.join(
          rootDirectory,
          'node_modules/@jacquesparis/objects-angular/objectsites',
        ),
      ),
    );

    const staticDirs = this.lbApp.getStaticDirs();
    for (const staticPath in staticDirs) {
      this.static(staticPath, staticDirs[staticPath]);
    }

    this.app.use('/', this.lbApp.requestHandler);
  }

  public static(basePath: string, dirName: string) {
    if (dirName.startsWith('node_modules/')) {
      dirName = path.join(this.rootDirectory, dirName);
    }
    this.app.use(
      basePath.startsWith('/') ? basePath : '/' + basePath,
      express.static(dirName),
    );
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
    try {
      this.server = this.app.listen(port, host);
      console.log('listening', host, port, `http://${host}:${port}`);
    } catch (error) {
      console.trace('not possible to listen', host, port);
    }
    if (host.startsWith('192.168.')) {
      this.app.listen(3000, 'localhost');
      console.log('listening', 'localhost', 3000, 'http://localhost:3000');
    }

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
