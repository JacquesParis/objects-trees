import {service} from '@loopback/core';
import {Sharp} from 'sharp';
import {EntityName} from '../../models';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {IMAGE_TYPE} from './../content-image/content-image.const';
import {ContentImageService} from './../content-image/content-image.definition';
import {Image} from './../content-image/content-image.interface';
import {CONTENT_IMAGE_THUMB_PROVIDER} from './content-image-thumb.const';
const sharp = require('sharp');

export class ContentImageThumbService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(ContentImageService)
    private contentImageService: ContentImageService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Build image Thumb and Web version',
      EntityName.objectNode,
      IMAGE_TYPE.name,
      this.completeImageNode.bind(this),
    );
  }
  /*
  public async completeImageGalleryTree(
    imageGallery: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    for (
      let imageIndex = 0;
      imageIndex < imageGallery.children.length;
      imageIndex++
    ) {
      if (
        0 ===
        imageGallery.children[imageIndex].childrenByObjectTypeId[
          IMAGE_WEB_TYPE.name
        ].length
      ) {
         imageGallery.children[imageIndex] = await this.buildImages(
          imageGallery.children[imageIndex] as ImageTree,
        );
      }
    }
  }
  */

  public async completeImageNode(image: Image): Promise<void> {
    await this.contentImageService.addTransientContent(image);
    const img: Sharp = sharp(Buffer.from(image.contentImage.base64, 'base64'));
    img.resize(200, 200, {});
    image.contentImage.base64 = (await img.toBuffer()).toString('base64');
  }
}
