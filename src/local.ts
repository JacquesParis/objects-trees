import {BootMixin} from '@loopback/boot';
import {RepositoryMixin} from '@loopback/repository';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {ObjectTreesApplication} from './application';
import {STORAGE_DIRECTORY} from './constants';
import {PostTypeProvider} from './extensions/post/post-type.provider';
import {TravelStoryTypeProvider} from './extensions/travel-story/travel-story-type.provider';
import {ObjectTreesApplicationConfig} from './integration/object-trees-application.config';

export class LocalDeployApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(ObjectTreesApplication)),
) {
  constructor(options: ObjectTreesApplicationConfig = {}) {
    options.extensions = [PostTypeProvider, TravelStoryTypeProvider];
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
