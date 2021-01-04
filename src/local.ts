import {BootMixin} from '@loopback/boot';
import {RepositoryMixin} from '@loopback/repository';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {ObjectTreesApplication} from './application';
import {STORAGE_DIRECTORY} from './constants';
import {ContentImageThumbProvider} from './extensions/content-image-thumb/content-image-thumb.provider';
import {PostTypeProvider} from './extensions/post/post.provider';
import {TravelStoryTypeProvider} from './extensions/travel-story/travel-story-type.provider';
import {WebSiteProvider} from './extensions/web-site/web-site.provider';
import {ObjectTreesApplicationConfig} from './integration/object-trees-application.config';

export class LocalDeployApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(ObjectTreesApplication)),
) {
  constructor(options: ObjectTreesApplicationConfig = {}) {
    options.extensions = [
      WebSiteProvider,
      PostTypeProvider,
      TravelStoryTypeProvider,
      ContentImageThumbProvider,
    ];
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
  }
}
