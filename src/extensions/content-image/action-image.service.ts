import {service} from '@loopback/core';
import {indexOf} from 'lodash';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {
  CurrentContext,
  ExpectedValue,
} from './../../services/application.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {
  CONTENT_IMAGE_PROVIDER,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './content-image.const';
import {Image} from './content-image.definition';

export class ActionImageService {
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
  ) {
    this.actionEntityService.registerNewActionTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Load and create several Image entities in an Image Gallery',
      EntityName.objectNode,
      'load',
      IMAGE_GALLERY_TYPE.name,
      this.loadImageGalleryNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewActionTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Load and create several Image entities in a referenced Image Gallery',
      EntityName.objectNode,
      'load',
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.loadImageGalleryReferrerNode.bind(this),
      'create',
    );
  }

  protected createImage(
    image: Image,
    parent: ObjectNode,
    parentType?: ObjectType,
  ): Promise<ObjectNode> {
    const childCtx: CurrentContext = CurrentContext.get({
      nodeContext: {
        parent: new ExpectedValue(parent),
        parentType: new ExpectedValue(parentType),
      },
    });
    const nameParts = image.name.split('.');
    if (1 < nameParts.length) {
      nameParts.pop();
    }

    return this.objectNodeService.add(
      {
        name: nameParts.join('.'),
        parentNodeId: parent.id,
        objectTypeId: IMAGE_TYPE.name,
        contentImage: image,
      },
      childCtx,
    );
  }

  public async loadImageGalleryNode(
    gallery: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<void> {
    const images: {images: Image[]} = args as {images: Image[]};
    for (const image of images.images) {
      await this.createImage(
        image,
        ctx.nodeContext.node.value,
        ctx.nodeContext.objectType.value,
      );
      /*
      const childCtx: CurrentContext = CurrentContext.get({
        nodeContext: {
          parent: ctx.nodeContext.node,
          parentType: ctx.nodeContext.objectType,
        },
      });
      const nameParts = image.name.split('.');
      if (1 < nameParts.length) {
        nameParts.pop();
      }

      await this.objectNodeService.add(
        {
          name: nameParts.join('.'),
          parentNodeId: gallery.id,
          objectTypeId: IMAGE_TYPE.name,
          contentImage: image,
        },
        childCtx,
      );*/
    }
  }

  public async loadImageGalleryReferrerNode(
    objectNode: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<void> {
    if (objectNode.imageGalleryObjectTreeId) {
      const imageGalleryParts = objectNode.imageGalleryObjectTreeId.split('/');
      const imageGalleryNode = await this.objectNodeService.searchTree(
        imageGalleryParts[1],
        imageGalleryParts[2],
        imageGalleryParts[3],
        imageGalleryParts[4],
        imageGalleryParts[5],
        imageGalleryParts[6],
      );

      if (imageGalleryNode) {
        let selectedImages: string[] | undefined = undefined;
        let initialSelectedImagesCount = 0;
        const implementedTypes = await this.objectTypeService.getImplementedTypes(
          objectNode.objectTypeId,
        );
        if (-1 < indexOf(implementedTypes, IMAGE_GALLERY_SELECTOR_TYPE.name)) {
          selectedImages = objectNode.selectedImages
            ? objectNode.selectedImages
            : [];
          initialSelectedImagesCount = (selectedImages as string[]).length;
        }

        const images: {images: Image[]} = args as {images: Image[]};
        for (const image of images.images) {
          const imageObject = await this.createImage(image, imageGalleryNode);
          if (imageObject && selectedImages) {
            selectedImages.push(imageObject.name);
          }
        }

        if (
          selectedImages &&
          selectedImages.length > initialSelectedImagesCount
        ) {
          await this.objectNodeService.modifyById(
            objectNode.id as string,
            {selectedImages},
            ctx,
          );
        }
      }
    }
  }
}
