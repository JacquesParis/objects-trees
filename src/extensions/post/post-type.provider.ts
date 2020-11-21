import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  DATE_TYPE,
  GALLERY_TYPE,
  MENU_TYPE,
  POST_NAME,
  POST_TEXT_SUBTYPE,
  POST_TYPE,
  POST_WITH_DATE_SUBTYPE,
  POST_WITH_DATE_TYPE,
  POST_WITH_GALLERY_SUBTYPE,
  POST_WITH_GALLERY_TYPE,
  POST_WITH_MENU_SUBTYPE,
  POST_WITH_MENU_TYPE,
  TEXT_TYPE,
} from './post-type.const';

export class PostTypeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(POST_NAME, app);

    this.objectTypes.types.postType = POST_TYPE;
    this.objectTypes.types.textType = TEXT_TYPE;
    this.objectTypes.types.dateType = DATE_TYPE;
    this.objectTypes.types.menuType = MENU_TYPE;
    this.objectTypes.types.galleryType = GALLERY_TYPE;
    this.objectTypes.types.postWithDateType = POST_WITH_DATE_TYPE;
    this.objectTypes.types.postWithMenuType = POST_WITH_MENU_TYPE;
    this.objectTypes.types.postWithGalleryType = POST_WITH_GALLERY_TYPE;
    this.objectTypes.subTypes = [
      POST_TEXT_SUBTYPE,
      POST_WITH_DATE_SUBTYPE,
      POST_WITH_MENU_SUBTYPE,
      POST_WITH_GALLERY_SUBTYPE,
    ];
  }
}
