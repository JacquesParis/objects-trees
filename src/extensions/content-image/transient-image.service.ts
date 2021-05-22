/* eslint-disable no-empty */
import {service} from '@loopback/core';
import exifr from 'exifr';
import {cloneDeep, filter, indexOf, isObject} from 'lodash';
import sharp, {Sharp} from 'sharp';
import {addCondition} from '../../helper';
import {ObjectTreeService} from '../../services';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {
  CurrentContext,
  EntityActionType,
} from './../../services/application.service';
import {NodeInterceptService} from './../../services/entity-intercept/node-intercept.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
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
    @service(NodeInterceptService)
    private nodeInterceptService: NodeInterceptService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(UriCompleteService)
    private uriCompleteService: UriCompleteService,
    @service(ContentImageService)
    private contentImageService: ContentImageService,
    @service(ObjectTreeService)
    private objectTreeService: ObjectTreeService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
  ) {
    this.nodeInterceptService.registerEntityInterceptorService(
      CONTENT_IMAGE_PROVIDER,
      TransientImageService.name,
      'Set position and date from Exif image data',
      IMAGE_TYPE.name,
      EntityActionType.create,
      this.interceptImageNodeCreate.bind(this),
    );
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
      'Add load Images method definition to load several images in one operation and reset images position and date info method',
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
      'Add image EXIF info and reset info method',
      EntityName.objectNode,
      IMAGE_TYPE.name,
      this.completeImageTypeNode.bind(this),
    );
  }

  public async interceptImageNodeCreate(
    entityId: string | undefined,
    image: ObjectNode,
    requestEntity: Partial<ObjectNode>,
    ctx: CurrentContext,
  ): Promise<boolean> {
    try {
      if (!requestEntity.imagePosition || !requestEntity.imageDate) {
        const exif: {
          latitude?: number;
          longitude?: number;
          CreateDate?: Date;
          DateTimeOriginal?: Date;
          ModifyDate?: Date;
        } = (await this.getImageExif(requestEntity as Image)) as {
          latitude?: number;
          longitude?: number;
          CreateDate?: Date;
          DateTimeOriginal?: Date;
          ModifyDate?: Date;
        };
        if (!requestEntity.imagePosition) {
          const position = this.getPositionFromExif(exif);
          if (position) {
            requestEntity.imagePosition = position;
          }
        }
        if (!requestEntity.imageDate) {
          const date = this.getImageDateFromExif(exif);
          if (date) {
            requestEntity.imageDate = date;
          }
        }
      }
    } catch (error) {}
    return true;
  }

  public async getImageExif(image: {
    contentImage?: {base64?: string};
  }): Promise<unknown> {
    let result = {};
    if (image?.contentImage?.base64) {
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

  public async getImageMetadata(image: Image): Promise<unknown> {
    let result = {};
    if (image.contentImage?.base64) {
      try {
        const img: Sharp = sharp(
          Buffer.from(image.contentImage.base64, 'base64'),
        );

        result = await img.metadata();
      } finally {
        if (!result) {
          result = {};
        }
      }
    }
    return result;
  }

  public getImageDateFromExif(exifData: {
    CreateDate?: Date;
    DateTimeOriginal?: Date;
    ModifyDate?: Date;
  }): string | undefined {
    const imageDate: Date | undefined = exifData.CreateDate
      ? exifData.CreateDate
      : exifData.DateTimeOriginal
      ? exifData.DateTimeOriginal
      : exifData.ModifyDate
      ? exifData.ModifyDate
      : undefined;
    return imageDate ? imageDate.toISOString() : undefined;
  }

  public getPositionFromExif(exifData: {
    latitude?: number;
    longitude?: number;
  }): string | undefined {
    return exifData.latitude && exifData.longitude
      ? `${exifData.latitude},${exifData.longitude}`
      : undefined;
  }

  public async completeImageTypeNode(imageNode: Image, ctx: CurrentContext) {
    if (
      imageNode.contentImage?.base64 &&
      imageNode.entityCtx?.jsonSchema?.properties
    ) {
      imageNode.metadata = await this.getImageMetadata(imageNode);
      for (const key of Object.keys(imageNode.metadata)) {
        if (
          isObject(imageNode.metadata[key]) &&
          !(imageNode.metadata[key] instanceof Date)
        ) {
          delete imageNode.metadata[key];
        }
      }

      imageNode.entityCtx.jsonSchema.properties.metadata = {
        title: 'Metadata image info',
        type: 'object',
        'x-schema-form': {
          type: 'json',
          readonly: true,
          disabled: true,
        },
      };

      imageNode.exif = await this.getImageExif(imageNode);
      for (const key of Object.keys(imageNode.exif)) {
        if (
          isObject(imageNode.exif[key]) &&
          !(imageNode.exif[key] instanceof Date)
        ) {
          delete imageNode.exif[key];
        }
      }
      const imageDate: string | undefined = this.getImageDateFromExif(
        imageNode.exif,
      );
      if (
        imageDate &&
        imageNode.entityCtx?.jsonSchema?.properties?.imageDate?.[
          'x-schema-form'
        ]?.conditionalValue
      ) {
        imageNode.entityCtx.jsonSchema.properties.imageDate[
          'x-schema-form'
        ].conditionalValue.defaultValue = `return ${JSON.stringify(imageDate)}`;
      }
      const imagePosition: string | undefined = this.getPositionFromExif(
        imageNode.exif,
      );
      if (
        imagePosition &&
        imageNode.entityCtx?.jsonSchema?.properties?.imagePosition?.[
          'x-schema-form'
        ]?.conditionalValue
      ) {
        imageNode.entityCtx.jsonSchema.properties.imagePosition[
          'x-schema-form'
        ].conditionalValue.defaultValue = `return ${JSON.stringify(
          imagePosition,
        )}`;
      }

      imageNode.entityCtx.jsonSchema.properties.exif = {
        title: 'EXIF image info',
        type: 'object',
        'x-schema-form': {
          type: 'json',
          readonly: true,
          disabled: true,
        },
      };

      if (imageDate || imagePosition) {
        if (!imageNode.entityCtx?.actions) {
          imageNode.entityCtx.actions = {};
        }
        if (!imageNode.entityCtx.actions.methods) {
          imageNode.entityCtx.actions.methods = [];
        }
        imageNode.entityCtx.actions.methods.push({
          methodId: 'resetInfo',
          methodName: 'Reset information',
          actionName: 'Reset information from image',
          parameters: {
            type: 'object',
            properties: {},
          },
          icon: 'fas fa-undo',
        });
        if (imagePosition) {
          imageNode.entityCtx.actions.methods[
            imageNode.entityCtx.actions.methods.length - 1
          ].parameters.properties.position = {
            type: 'boolean',
            title: `Reset position (to <a href="https://maps.google.com/maps?q=${imagePosition}&t=&z=15&ie=UTF8" target="_new">${imagePosition}</a>)`,
            default: true,
          };
        }
        if (imageDate) {
          imageNode.entityCtx.actions.methods[
            imageNode.entityCtx.actions.methods.length - 1
          ].parameters.properties.date = {
            type: 'boolean',
            title: `Reset date (to ${imageDate})`,
            default: true,
          };
        }
      }
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
    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    if (!objectNode.entityCtx?.actions) {
      objectNode.entityCtx.actions = {};
    }
    if (!objectNode.entityCtx.actions.methods) {
      objectNode.entityCtx.actions.methods = [];
    }
    await this.addLoadImagesJsonSchemaMethod(objectNode, ctx);

    const galleryTree: ObjectTree = await this.insideRestService.read<ObjectTree>(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        objectNode.id as string,
        ctx,
      ),
      ctx,
    );
    if (0 < galleryTree.children.length) {
      let handlebarsMethodSampling = '[';
      for (const imageTree of galleryTree.children) {
        handlebarsMethodSampling +=
          ('[' === handlebarsMethodSampling ? '' : ',') +
          `
        {
          "uri":${JSON.stringify(imageTree.treeNode.uri)},
          "methodId": "resetInfo",
          "parameters":{
            "position": {{&json position}},
            "date": {{&json date}}
          }
        }`;
      }
      handlebarsMethodSampling += `
         {{#order}},
            {
              "methodId":"resetOrder",
              "parameters":{ }
            }
         {{/order}}
      `;
      handlebarsMethodSampling += ']';
      objectNode.entityCtx.actions.methods.push({
        methodId: 'resetInfo',
        methodName: 'Reset images information and order',
        actionName: 'Reset information from images and order them',
        parameters: {
          type: 'object',
          properties: {
            position: {
              type: 'boolean',
              title: `Reset images position`,
              default: true,
            },
            date: {
              type: 'boolean',
              title: `Reset images date`,
              default: true,
            },
            order: {
              type: 'boolean',
              title: `Reset images order`,
              default: true,
            },
          },
        },
        icon: 'fas fa-undo',
        handlebarsMethodSampling: handlebarsMethodSampling,
      });
    }
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
              'x-schema-form': {
                type: 'conditional-text',
                conditionalValue: {
                  title: 'Specify a gallery name',
                  defaultValue: `return ${JSON.stringify(objectNode.title)}`,
                },
              },
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
              "title": {{&json ../title}},
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

      properties.title = {
        type: 'string',
        title: 'Displayed name',
        'x-schema-form': {
          type: 'conditional-text',
          conditionalValue: {
            title: 'Specify a label for images',
            defaultValue: `return ${JSON.stringify(objectNode.title)}`,
          },
        },
        default: objectNode.title,
      };
      addCondition(
        '(true === model.useExistingGallery && model.imageGalleryObjectTreeId) || !model.useExistingGallery',
        properties.title,
      );

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
          title: {
            type: 'string',
            title: 'Displayed name',
            'x-schema-form': {
              type: 'conditional-text',
              conditionalValue: {
                title: 'Specify a label for images',
                defaultValue: `return ${JSON.stringify(objectNode.title)}`,
              },
            },
            default: objectNode.title,
          },
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
              "title": {{&json ../title}},
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
