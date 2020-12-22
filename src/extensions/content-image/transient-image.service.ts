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
      EntityName.objectNode,
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.completeImageGalleryReferrerNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
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
    if (
      !objectNode.imageGalleryObjectTree &&
      objectNode.imageGalleryObjectTreeUri
    ) {
      objectNode.imageGalleryObjectTree = (await this.insideRestService.read(
        objectNode.imageGalleryObjectTreeUri,
        ctx,
      )) as ObjectTree;
    }
    if (objectNode.imageGalleryObjectTree?.children) {
      for (const image of objectNode.imageGalleryObjectTree.children) {
        images.push(image.treeNode);
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
            image.name,
          );
          objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enumNames.push(
            image.name +
              '<span class="imageSelect"><img src="' +
              image.contentImageUri +
              '" ></span>',
          );
        }
        if (objectNode.selectedImages && 0 < objectNode.selectedImages.length) {
          objectNode.images = filter(
            images,
            (image) => -1 < indexOf(objectNode.selectedImages, image.name),
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
