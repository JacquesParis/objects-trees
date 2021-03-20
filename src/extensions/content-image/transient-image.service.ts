/* eslint-disable no-empty */
import {service} from '@loopback/core';
import {filter, indexOf} from 'lodash';
import {addCondition} from '../../helper';
import {ObjectTreeService} from '../../services';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {
  CONTENT_IMAGE_PROVIDER,
  DISPLAYED_IMAGE_GALLERY_TYPE,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './content-image.const';
import {ContentImageService} from './content-image.definition';
export class TransientImageService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ContentImageService)
    private contentImageService: ContentImageService,
    @service(ObjectTreeService)
    private objectTreeService: ObjectTreeService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Add referenced images field and its json schema definition. Add load Images method',
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
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Add all images of the gallery as referenced images',
      EntityName.objectTree,
      DISPLAYED_IMAGE_GALLERY_TYPE.name,
      this.completeDisplayedImageGalleryTree.bind(this),
    );
  }

  public async completeDisplayedImageGalleryTree(
    entity: ObjectTree,
    ctx: CurrentContext,
  ) {
    const images: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(entity)
    )[IMAGE_TYPE.name];
    entity.images = images ? images : [];
  }

  private async completeImageGalleryTypeNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    await this.addLoadImagesJsonSchemaMethod(objectNode, ctx);
  }

  public async addLoadImagesJsonSchemaMethod(
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
      handlebarsMethodSampling:
        '[{{#images}} {"methodId":"load","parameters":{"images":[{{&json this}} ]} }{{#unless @last}},{{/unless}}{{/images}}]',
    });
  }

  public async completeImageGalleryReferrerNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    const images = [];
    if (!objectNode.imageGalleryTree && objectNode.imageGalleryObjectTreeUri) {
      try {
        objectNode.imageGalleryTree = (await this.insideRestService.read(
          objectNode.imageGalleryObjectTreeUri,
          ctx,
        )) as ObjectTree;
      } catch (error) {}
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
          if (
            -1 ===
            indexOf(
              objectNode.entityCtx.jsonSchema.properties.selectedImages.items
                .enum,
              image.treeNode.name,
            )
          ) {
            objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enum.push(
              image.treeNode.name,
            );
            objectNode.entityCtx.jsonSchema.properties.selectedImages.items.enumNames.push(
              image.treeNode.name +
                '<span class="imageSelect"><img onclick="showImg(\'' +
                image.treeNode.contentImageUri +
                '\')" src="' +
                image.treeNode.contentImageUri +
                '" ></span>',
            );
          }
        }
        if (objectNode.selectedImages) {
          objectNode.images = filter(
            images,
            (image) =>
              -1 < indexOf(objectNode.selectedImages, image.treeNode.name),
          );
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
    if (objectNode.imageGalleryTree) {
      await this.addLoadImagesJsonSchemaMethod(objectNode, ctx);
    }
  }
}
