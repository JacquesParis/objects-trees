import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {BootComponent} from './boot.component';
import {STORAGE_DIRECTORY} from './constants';
import {MySequence} from './sequence';

export class ObjectstreesApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  public static serverBase = 'http://127.0.0.1:3000/api';

  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    //    this.configureFileUpload(options.fileStorageDirectory);

    const destination = path.join(__dirname, '../.storage');
    this.bind(STORAGE_DIRECTORY).to(destination);

    this.bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS).to({limit: '50mb'});

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
  async boot(): Promise<void> {
    await super.boot();
    this.component(BootComponent);
  }
}
