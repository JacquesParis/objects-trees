import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {STORAGE_DIRECTORY} from './constants';

export class LocalDeployApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const app = this;
    // Set up default home page
    app.static('/', path.join(__dirname, '../public'));
    const destination = path.join(__dirname, '../.storage');
    app.bind(STORAGE_DIRECTORY).to(destination);
    app.projectRoot = __dirname;
  }
  async boot(): Promise<void> {
    await super.boot();

    // this.component(ObjectsTreesBootComponent);
  }
}
