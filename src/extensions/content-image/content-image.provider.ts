import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ActionImageService} from './action-image.service';
import {
  CONTENT_IMAGE_PROVIDER,
  IMAGE_GALLERIES_IMAGE_GALLERY_SUBTYPE,
  IMAGE_GALLERIES_TYPE,
  IMAGE_GALLERY_IMAGE_SUBTYPE,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './content-image.const';
import {
  ContentImage,
  ContentImageRepository,
  ContentImageService,
  Image,
} from './content-image.definition';
import {TransientImageService} from './transient-image.service';

export class ContentImageProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_IMAGE_PROVIDER, app);

    this.models.push(Image, ContentImage);
    this.repositories.push({repoClass: ContentImageRepository});

    this.services.push(
      {cls: ContentImageService},
      {cls: TransientImageService},
      {cls: ActionImageService},
    );

    this.objectTypes.imageGallery = IMAGE_GALLERY_TYPE;
    this.objectTypes.imageGalleries = IMAGE_GALLERIES_TYPE;
    this.objectTypes.imageGalleryReferrer = IMAGE_GALLERY_REFERRER_TYPE;
    this.objectTypes.image = IMAGE_TYPE;
    this.objectTypes.imageGallerySelector = IMAGE_GALLERY_SELECTOR_TYPE;

    this.objectSubTypes.push(
      IMAGE_GALLERIES_IMAGE_GALLERY_SUBTYPE,
      IMAGE_GALLERY_IMAGE_SUBTYPE,
    );
  }
}
