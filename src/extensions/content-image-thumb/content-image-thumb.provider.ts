import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {EntityInterceptProvider} from './../../services/entity-intercept/entity-intercept.provider';
import {InsideRestProvider} from './../../services/inside-rest/inside-rest.provider';
import {TransientEntityProvider} from './../../services/transient-entity/transient-entity.provider';
import {ContentImageProvider} from './../content-image/content-image.provider';
import {
  CONTENT_IMAGE_THUMB_PROVIDER,
  IMAGE_IMAGE_ORIGINAL_SUBTYPE,
  IMAGE_IMAGE_THUMB_SUBTYPE,
  IMAGE_ORIGINAL_TYPE,
  IMAGE_THUMB_TYPE,
} from './content-image-thumb.const';
import {ContentImageThumbService} from './content-image-thumb.service';

export class ContentImageThumbProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_IMAGE_THUMB_PROVIDER, app);

    this.requiredProviders.push(
      ContentImageProvider,
      TransientEntityProvider,
      InsideRestProvider,
      EntityInterceptProvider,
    );

    this.services.push({cls: ContentImageThumbService});

    this.objectTypes.push(IMAGE_THUMB_TYPE, IMAGE_ORIGINAL_TYPE);
    this.objectSubTypes.push(
      IMAGE_IMAGE_THUMB_SUBTYPE,
      IMAGE_IMAGE_ORIGINAL_SUBTYPE,
    );
  }
}
