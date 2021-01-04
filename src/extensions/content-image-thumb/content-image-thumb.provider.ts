import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ContentImageProvider} from './../content-image/content-image.provider';
import {
  CONTENT_IMAGE_THUMB_PROVIDER,
  IMAGE_IMAGE_WEB_SUBTYPE,
  IMAGE_ORIGINAL_TYPE,
  IMAGE_WEB_IMAGE_ORIGINAL_SUBTYPE,
  IMAGE_WEB_TYPE,
} from './content-image-thumb.const';
import {ContentImageThumbService} from './content-image-thumb.service';

export class ContentImageThumbProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_IMAGE_THUMB_PROVIDER, app);

    this.requiredProviders.push(ContentImageProvider);

    this.services.push({cls: ContentImageThumbService});

    this.objectTypes.push(IMAGE_WEB_TYPE, IMAGE_ORIGINAL_TYPE);
    this.objectSubTypes.push(
      IMAGE_IMAGE_WEB_SUBTYPE,
      IMAGE_WEB_IMAGE_ORIGINAL_SUBTYPE,
    );
  }
}
