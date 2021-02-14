import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ContentImageProvider} from '../content-image/content-image.provider';
import {
  POST_PROVIDER,
  POST_TYPE,
  //  POST_WITH_GALLERY_SUBTYPE,
  POST_WITH_GALLERY_TYPE,
  POST_WITH_SUB_POST_TYPE,
} from './post.const';
import {PostService} from './post.service';

export class PostTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(POST_PROVIDER, app);
    this.requiredProviders.push(ContentImageProvider);
    this.services.push({cls: PostService});

    this.objectTypes.push(
      POST_TYPE,
      POST_WITH_GALLERY_TYPE,
      POST_WITH_SUB_POST_TYPE,
    );

    //   this.objectSubTypes.push(POST_WITH_GALLERY_SUBTYPE);
  }
}
