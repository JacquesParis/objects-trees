/* eslint-disable no-empty */
import {service} from '@loopback/core';
import exifr from 'exifr';
import {cloneDeep, filter, indexOf, isObject} from 'lodash';
import {addCondition} from '../../helper';
import {ObjectTreeService} from '../../services';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {ObjectTypeService} from './../../services/object-type.service';
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
import {Image} from './content-image.interface';

const exifrOptions: {
  translateKeys?: boolean;
  translateValues?: boolean;
  reviveValues?: boolean;

  // TIFF segment
  tiff?: boolean;
  ifd1?: boolean;
  exif?: boolean;
  gps?: boolean;
  interop?: boolean;
  // Other segments
  jfif?: boolean;
  iptc?: boolean;
  xmp?: boolean;
  icc?: boolean;
  makerNote?: boolean;
  userComment?: boolean;
  // other options
  sanitize?: boolean;
  mergeOutput?: boolean;
  firstChunkSize?: number;
  chunkSize?: number;
  chunkLimit?: number;
} = {
  translateKeys: true,
  translateValues: true,
  xmp: true,
  icc: true,
  iptc: true,
  jfif: true, // (jpeg only)
  ifd1: true, // aka thumbnail
  // Other TIFF tags
  makerNote: true,
  userComment: true,
};
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
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Add referenced images field and its json schema definition. Add load Images method. Add create Gallery method.',
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
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      TransientEntityService.name,
      'Add image EXIF info',
      EntityName.objectNode,
      IMAGE_TYPE.name,
      this.completeImageTypeNode.bind(this),
    );
  }

  public async getImageExif(image: Image): Promise<unknown> {
    let result = {};
    if (image.contentImage?.base64) {
      try {
        result = await exifr.parse(
          Buffer.from(image.contentImage.base64, 'base64'),
          exifrOptions,
        );
      } finally {
        if (!result) {
          result = {};
        }
      }
    }
    return result;
  }

  public async completeImageTypeNode(image: Image, ctx: CurrentContext) {
    if (image.contentImage?.base64 && image.entityCtx?.jsonSchema?.properties) {
      image.exif = await this.getImageExif(image);
      for (const key of Object.keys(image.exif)) {
        if (isObject(image.exif[key])) {
          delete image.exif[key];
        }
      }

      image.entityCtx.jsonSchema.properties.exif = {
        title: 'EXIF image info',
        type: 'object',
        'x-schema-form': {
          type: 'json',
          readonly: true,
          disabled: true,
        },
      };
    }
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

  public async getImageGalleriesParents(
    objectNode: ObjectNode,
  ): Promise<ObjectNode[]> {
    const galleriesType: string[] = await this.objectTypeService.getParentTypesOfImplementingType(
      IMAGE_GALLERY_TYPE.name,
    );
    return this.objectNodeService.searchByParentNamespaceId(
      objectNode.parentNamespaceId,
      {
        objectTypeIds: galleriesType,
      },
    );
  }

  public async addCreateImagesGalleryJsonSchemaMethod(
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
    const imageGalleries: ObjectNode[] = await this.getImageGalleriesParents(
      objectNode,
    );
    if (imageGalleries && 0 < imageGalleries.length) {
      objectNode.entityCtx.actions.methods.push({
        methodId: 'createGallery',
        methodName: 'Create images gallery',
        actionName: 'Create gallery',
        parameters: {
          type: 'object',
          properties: {
            useExistingGallery: {
              type: 'boolean',
              title: 'Use existing gallery',
            },
            name: {
              type: 'string',
              title: 'Gallery name',
            },
          },
        },
        handlebarsMethodSampling: `[
          {{^useExistingGallery}}
            {
              "methodId": "createGallery",
              "parameters":{
                "name": {{&json name}},
                "parentId": {{&json parentId}}
              }
            }
          {{/useExistingGallery}}
          {{#useExistingGallery}}
            {
              "methodId": "configureGallery",
              "parameters":{
                "imageGalleryObjectTreeId": {{&json imageGalleryObjectTreeId}}
              }
            }
          {{/useExistingGallery}}
          {{#images}},
          {
            "methodId":"load",
            "parameters": {
              "images": [
                {{&json this}}
              ]
            }
          }{{/images}}
          ]`,
        icon: 'far fa-images',
      });
      const properties =
        objectNode.entityCtx.actions.methods[
          objectNode.entityCtx.actions.methods.length - 1
        ].parameters.properties;
      if (1 < imageGalleries.length) {
        properties.parentId = {
          type: 'string',
          title: 'Galleries parent',
          required: true,
          oneOf: imageGalleries.map((gallery) => ({
            enum: [gallery.id],
            title: gallery.name,
          })),
        };
      }
      if (
        objectNode.entityCtx?.jsonSchema?.properties.imageGalleryObjectTreeId
          ?.oneOf?.length > 0
      ) {
        addCondition('true !== model.useExistingGallery', properties.name);
        if (properties.parentId) {
          addCondition(
            'true !== model.useExistingGallery',
            properties.parentId,
          );
        }
        properties.imageGalleryObjectTreeId = cloneDeep(
          objectNode.entityCtx?.jsonSchema?.properties.imageGalleryObjectTreeId,
        );
        properties.imageGalleryObjectTreeId.required = true;
        addCondition(
          'true === model.useExistingGallery',
          properties.imageGalleryObjectTreeId,
        );
      } else {
        delete properties.useExistingGallery;
      }

      properties.images = {
        type: 'array',
        'x-schema-form': {
          type: 'images',
        },
        items: (await this.contentImageService.getContentDefinition())
          .properties.contentImage,
      };
      addCondition(
        '(true === model.useExistingGallery && model.imageGalleryObjectTreeId) || !model.useExistingGallery',
        properties.images,
      );
    }
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
      handlebarsMethodSampling: `[{{#images}}
          {
            "methodId":"load",
            "parameters": {
              "images": [
                {{&json this}}
              ]
            }
          }{{#unless @last}},{{/unless}}{{/images}}
        ]`,
      icon: 'far fa-images',
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
    } else {
      await this.addCreateImagesGalleryJsonSchemaMethod(objectNode, ctx);
    }
  }
}
