import {service} from '@loopback/core';
import {assign} from 'lodash';
import {Metadata, Sharp} from 'sharp';
import {EntityName} from '../../models';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {
  CurrentContext,
  ExpectedValue,
} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {IMAGE_GALLERY_TYPE} from './../content-image/content-image.const';
import {ContentImageService} from './../content-image/content-image.definition';
import {
  CONTENT_IMAGE_THUMB_PROVIDER,
  IMAGE_ORIGINAL_TYPE,
  IMAGE_THUMB_TYPE,
} from './content-image-thumb.const';
const sharp = require('sharp');

export class ContentImageThumbService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(ContentImageService)
    private contentImageService: ContentImageService,
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(InsideRestService) private insideRestService: InsideRestService,
  ) {
    /*
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Build image Thumb and Web version',
      EntityName.objectNode,
      IMAGE_TYPE.name,
      this.completeImageNode.bind(this),
    );*/

    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Build image Thumb and Web version',
      EntityName.objectTree,
      IMAGE_GALLERY_TYPE.name,
      this.completeImageGalleryTree.bind(this),
    );
  }

  public async completeImageGalleryTree(
    imageGallery: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    let hasNewNodes = false;
    for (const image of imageGallery.children) {
      if (!(IMAGE_ORIGINAL_TYPE.name in image.childrenByObjectTypeId)) {
        await this.contentImageService.addTransientContent(image.treeNode);
        if (
          !image.treeNode.contentImage ||
          !image.treeNode.contentImage.base64
        ) {
          continue;
        }
        await this.objectNodeService.add(
          {
            name: 'original',
            parentNodeId: image.treeNode.id,
            objectTypeId: IMAGE_ORIGINAL_TYPE.name,
            contentImage: {
              base64: image.treeNode.contentImage.base64,
              size: image.treeNode.contentImage.size,
              name: image.treeNode.contentImage.name,
              type: image.treeNode.contentImage.type,
            },
          },
          CurrentContext.get({
            nodeContext: {
              parent: new ExpectedValue<ObjectNode>(image.treeNode),
            },
          }),
        );
        hasNewNodes = true;
        const newSize = await this.changeImgSize(
          image.treeNode.contentImage,
          800,
        );
        await this.objectNodeService.modifyById(
          image.treeNode.id as string,
          {
            contentImage: {
              base64: newSize.base64,
              size: newSize.size,
              name: image.treeNode.contentImage.name,
              type: image.treeNode.contentImage.type,
            },
          },
          CurrentContext.get({
            nodeContext: {
              node: new ExpectedValue<ObjectNode>(image.treeNode),
            },
          }),
        );
      }
      if (!(IMAGE_THUMB_TYPE.name in image.childrenByObjectTypeId)) {
        if (
          !image.treeNode.contentImage ||
          !image.treeNode.contentImage.base64
        ) {
          await this.contentImageService.addTransientContent(image.treeNode);
        }
        if (
          !image.treeNode.contentImage ||
          !image.treeNode.contentImage.base64
        ) {
          continue;
        }
        hasNewNodes = true;
        const newSize = await this.changeImgSize(
          image.treeNode.contentImage,
          200,
        );
        await this.objectNodeService.add(
          {
            name: 'thumb',
            parentNodeId: image.treeNode.id,
            objectTypeId: IMAGE_THUMB_TYPE.name,
            contentImage: {
              base64: newSize.base64,
              size: newSize.size,
              name: image.treeNode.contentImage.name,
              type: image.treeNode.contentImage.type,
            },
          },
          CurrentContext.get({
            nodeContext: {
              parent: new ExpectedValue<ObjectNode>(image.treeNode),
            },
          }),
        );
      }
    }
    if (hasNewNodes) {
      const newGallery = await this.insideRestService.read(
        imageGallery.uri,
        ctx,
        true,
      );
      assign(imageGallery, newGallery);
    } else {
      for (const image of imageGallery.children) {
        image.thumb =
          image.childrenByObjectTypeId[IMAGE_THUMB_TYPE.name][0].treeNode;
        image.original =
          image.childrenByObjectTypeId[IMAGE_ORIGINAL_TYPE.name][0].treeNode;
      }
    }
  }

  /*
  public async completeImageNode(image: Image): Promise<void> {
    await this.contentImageService.addTransientContent(image);
    const img: Sharp = sharp(Buffer.from(image.contentImage.base64, 'base64'));
    img.resize(200, 200, {});
    image.contentImage.base64 = (await img.toBuffer()).toString('base64');
  }*/

  public async changeImgSize(
    contentImage: {
      base64: string;
      size: string;
    },
    size: number,
  ): Promise<{
    base64: string;
    size: string;
  }> {
    let img: Sharp = sharp(Buffer.from(contentImage.base64, 'base64'));

    let width = size;
    let height = size;

    const metadata: Metadata = await img.metadata();
    if (metadata.width && metadata.height) {
      const maxSize = Math.max(metadata.width, metadata.height);
      if (size <= maxSize) {
        return contentImage;
      }
      width = (width * size) / maxSize;
      height = (height * size) / maxSize;
    }
    img = img.resize(width, height, {
      fit: 'contain',
      background: {r: 255, g: 255, b: 255, alpha: 1},
    });
    const newMetadata: Metadata = await img.metadata();
    return {
      base64: (await img.toBuffer()).toString('base64'),
      size: '' + newMetadata.size,
    };
  }
}
