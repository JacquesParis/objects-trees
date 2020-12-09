import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  GALLERY_TYPE,
  POST_NAME,
  POST_TYPE,
  POST_WITH_GALLERY_SUBTYPE,
  POST_WITH_GALLERY_TYPE,
} from './post-type.const';

export class PostTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(POST_NAME, app);
    this.objectTypes.postType = POST_TYPE;
    this.objectTypes.galleryType = GALLERY_TYPE;
    this.objectTypes.postWithGalleryType = POST_WITH_GALLERY_TYPE;

    this.objectSubTypes.push(POST_WITH_GALLERY_SUBTYPE);
  }
}
