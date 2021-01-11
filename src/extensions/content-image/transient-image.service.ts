import {service} from '@loopback/core';
import {filter, indexOf} from 'lodash';
import {addCondition} from '../../helper';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {
  CONTENT_IMAGE_PROVIDER,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
} from './content-image.const';
import {ContentImageService} from './content-image.definition';
export class TransientImageService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ContentImageService)
    private contentImageService: ContentImageService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Add referenced images field and its json schema definition',
      EntityName.objectNode,
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.completeImageGalleryReferrerNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Add load Images method definition to load several images in one operation',
      EntityName.objectNode,
      IMAGE_GALLERY_TYPE.name,
      this.completeImageGalleryTypeNode.bind(this),
    );
  }

  public async completeImageGalleryTypeNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    if (!objectNode.entityCtx?.actions) {
      objectNode.entityCtx.actions = {};
    }
    if (!objectNode.entityCtx.actions.methods) {
      objectNode.entityCtx.actions.methods = [];
    }
    objectNode.entityCtx.actions.methods.push({
      methodId: 'load',
      methodName: 'Add images',
      actionName: 'Load images',
      parameters: {
        type: 'object',
        properties: {
          images: {
            type: 'array',

            'x-schema-form': {
              type: 'images',
            },

            items: (await this.contentImageService.getContentDefinition())
              .properties.contentImage,
          },
        },
      },
    });
  }

  public async completeImageGalleryReferrerNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    const images = [];
    if (!objectNode.imageGalleryTree && objectNode.imageGalleryObjectTreeUri) {
      objectNode.imageGalleryTree = (await this.insideRestService.read(
        objectNode.imageGalleryObjectTreeUri,
        ctx,
      )) as ObjectTree;
    }
    if (objectNode.imageGalleryTree?.children) {
      for (const image of objectNode.imageGalleryTree.children) {
        images.push(image);
      }
    }
    objectNode.images = images;

    if (
      -1 <
        indexOf(
          objectNode.entityCtx?.implementedTypes,
          IMAGE_GALLERY_SELECTOR_TYPE.name,
        ) &&
      objectNode.entityCtx?.jsonSchema?.properties?.selectedImages
    ) {
      if (0 < images.length) {
        objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enum = [];
        objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enumNames = [];
        for (const image of images) {
          objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enum.push(
            image.treeNode.name,
          );
          objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enumNames.push(
            image.treeNode.name +
              '<span class="imageSelect"><img src="' +
              image.treeNode.contentImageUri +
              '" ></span>',
          );
        }
        if (objectNode.selectedImages && 0 < objectNode.selectedImages.length) {
          objectNode.images = filter(
            images,
            (image) =>
              -1 < indexOf(objectNode.selectedImages, image.treeNode.name),
          );
          if (0 === objectNode.images.length) {
            objectNode.selectedImages =
              objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enum;
            objectNode.images = images;
          }
        } else {
          objectNode.selectedImages =
            objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enum;
        }

        addCondition(
          "model.imageGalleryObjectTreeId=='" +
            objectNode.imageGalleryObjectTreeId +
            "'",
          objectNode.entityCtx.jsonSchema.properties.selectedImages,
        );
      } else {
        delete objectNode.entityCtx.jsonSchema.properties.selectedImages;
      }
    }
  }
}
