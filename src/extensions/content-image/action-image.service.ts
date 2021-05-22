import {service} from '@loopback/core';
import {indexOf} from 'lodash';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {ApplicationError} from './../../helper/application-error';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {ObjectType} from './../../models/object-type.model';
import {
  CurrentContext,
  ExpectedValue,
} from './../../services/application.service';
import {
  ObjectNodeDefinitionService,
  OneOfTreeOption,
} from './../../services/entity-definition/object-node-definition.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {SortMethod} from './../../services/object-tree/action-tree.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {TransientNodeService} from './../../services/transient-entity/transient-node.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {
  CONTENT_IMAGE_PROVIDER,
  IMAGE_GALLERIES_TYPE,
  IMAGE_GALLERY_REFERRER_TYPE,
  IMAGE_GALLERY_SELECTOR_TYPE,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './content-image.const';
import {Image} from './content-image.definition';
import {TransientImageService} from './transient-image.service';

export class ActionImageService {
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(InsideRestService) private insideRestService: InsideRestService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(ObjectNodeDefinitionService)
    private objectNodeDefinitionService: ObjectNodeDefinitionService,
    @service(TransientImageService)
    private transientImageService: TransientImageService,
    @service(TransientNodeService)
    private transientNodeService: TransientNodeService,
  ) {
    this.actionEntityService.registerNewMethodFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Load and create several Image entities in an Image Gallery',
      EntityName.objectNode,
      'load',
      IMAGE_GALLERY_TYPE.name,
      this.loadImageGalleryNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewMethodFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Load and create several Image entities in a referenced Image Gallery',
      EntityName.objectNode,
      'load',
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.loadImageGalleryReferrerNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewMethodFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Create new Image Gallery for a gallery referrer',
      EntityName.objectNode,
      'createGallery',
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.createGalleryImageGalleryReferrerNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewMethodFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Configure an Image Gallery for a gallery referrer',
      EntityName.objectNode,
      'configureGallery',
      IMAGE_GALLERY_REFERRER_TYPE.name,
      this.configureGalleryImageGalleryReferrerNode.bind(this),
      'update',
    );
    this.actionEntityService.registerNewMethodFunction<ObjectNode>(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Reset image position and/or date',
      EntityName.objectNode,
      'resetInfo',
      IMAGE_TYPE.name,
      this.resetInfoImageNode.bind(this),
      'update',
    );
    this.actionEntityService.registerNewMethodFunction<ObjectNode>(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Reset images order',
      EntityName.objectNode,
      'resetOrder',
      IMAGE_GALLERY_TYPE.name,
      this.resetOrderImageGalleryNode.bind(this),
      'update',
    );
  }

  public async resetOrderImageGalleryNode(
    entity: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const galleryTree: ObjectTree = await this.insideRestService.read<ObjectTree>(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        entity.id as string,
        ctx,
      ),
      ctx,
    );
    await new SortMethod(this.objectNodeService).runMethod(
      galleryTree,
      galleryTree.children
        .sort((a, b) => {
          if (!a.treeNode.imageDate && !b.treeNode.imageDate) {
            return (a.treeNode.index as number) - (b.treeNode.index as number);
          }
          if (!a.treeNode.imageDate || !b.treeNode.imageDate) {
            return !a.treeNode.imageDate ? 1 : -1;
          }
          return Date.parse(a.treeNode.imageDate) < Date.parse(b.treeNode.imageDate) ? -1 : 1;
        })
        .map((tree) => tree.treeNode.id as string),
      ctx,
    );

    return this.actionEntityService.getEntity<ObjectTree>(
      EntityName.objectTree,
      entity.id as string,
      CurrentContext.get(ctx, {}),
    );
  }

  public async resetInfoImageNode(
    entity: ObjectNode,
    args: {position?: boolean; date?: boolean},
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    if (args.position || args.date) {
      const update: Partial<ObjectNode> = {};
      if (entity.contentImageId && !entity.contentImage) {
        await this.transientNodeService.completeReturnedEntity(entity, ctx);
      }
      const exif: {
        latitude?: number;
        longitude?: number;
        CreateDate?: Date;
        DateTimeOriginal?: Date;
        ModifyDate?: Date;
      } = (await this.transientImageService.getImageExif(
        entity as {
          contentImage?: {base64?: string};
        },
      )) as {
        latitude?: number;
        longitude?: number;
        CreateDate?: Date;
        DateTimeOriginal?: Date;
        ModifyDate?: Date;
      };

      if (args.position) {
        const imagePosition = this.transientImageService.getPositionFromExif(
          exif,
        );
        if (imagePosition) {
          update.imagePosition = imagePosition;
        }
      }
      if (args.date) {
        const imageDate = this.transientImageService.getImageDateFromExif(exif);
        if (imageDate) {
          update.imageDate = imageDate;
        }
      }
      if (0 < Object.keys(update).length) {
        await this.objectNodeService.modifyById(
          entity.id as string,
          update,
          ctx,
        );
      }
    }
    return this.actionEntityService.getEntity<ObjectNode>(
      EntityName.objectNode,
      entity.id as string,
      CurrentContext.get(ctx, {}),
    );
  }

  protected async createImage(
    image: Image,
    parent: ObjectNode,
    ctx: CurrentContext,
    parentType?: ObjectType,
    title?: string,
  ): Promise<ObjectNode> {
    const childCtx: CurrentContext = CurrentContext.get(ctx, {
      nodeContext: {
        parent: new ExpectedValue(parent),
        parentType: new ExpectedValue(parentType),
      },
    });
    const nameParts = image.name.split('.');
    if (1 < nameParts.length) {
      nameParts.pop();
    }

    const exif: {
      latitude?: number;
      longitude?: number;
      CreateDate?: Date;
      DateTimeOriginal?: Date;
      ModifyDate?: Date;
    } = (await this.transientImageService.getImageExif({
      contentImage: image,
    })) as {
      latitude?: number;
      longitude?: number;
      CreateDate?: Date;
      DateTimeOriginal?: Date;
      ModifyDate?: Date;
    };
    const position = this.transientImageService.getPositionFromExif(exif);

    const date = this.transientImageService.getImageDateFromExif(exif);

    return this.objectNodeService.add(
      {
        name: title ? title : nameParts.join('.'),
        imagePosition: position,
        imageDate: date,
        parentNodeId: parent.id,
        objectTypeId: IMAGE_TYPE.name,
        contentImage: image,
      },
      childCtx,
      false,
      true,
      true,
    );
  }

  public async loadImageGalleryNode(
    gallery: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const images: {images: Image[]; title?: string} = args as {
      images: Image[];
      title?: string;
    };
    for (const image of images.images) {
      await this.createImage(
        image,
        ctx.nodeContext.node.value,
        ctx,
        ctx.nodeContext.objectType.value,
        images.title,
      );
    }
    return this.actionEntityService.getEntity<ObjectTree>(
      EntityName.objectTree,
      gallery.id as string,
      CurrentContext.get(ctx, {}),
    );
  }

  public async configureGalleryImageGalleryReferrerNode(
    objectNode: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    const imageGalleryObjectTreeId = (args as {
      imageGalleryObjectTreeId: string;
    }).imageGalleryObjectTreeId;

    if (
      undefined === imageGalleryObjectTreeId ||
      '' === imageGalleryObjectTreeId
    ) {
      throw ApplicationError.missingParameter(imageGalleryObjectTreeId);
    }

    await this.objectNodeService.modifyById(
      objectNode.id as string,
      {imageGalleryObjectTreeId: imageGalleryObjectTreeId},
      CurrentContext.get(ctx),
    );

    return this.actionEntityService.getEntity<ObjectNode>(
      EntityName.objectNode,
      objectNode.id as string,
      CurrentContext.get(ctx, {}),
    );
  }

  public async createGalleryImageGalleryReferrerNode(
    objectNode: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<[ObjectTree, ObjectNode] | undefined> {
    const creationArguments: {
      name?: string;
      parentId?: string;
      childTypeId?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = args as any;
    let name: string | undefined = creationArguments.name;
    if (!name || '' === name) {
      name = objectNode.title || objectNode.name;
    }
    let parentId: string | undefined = creationArguments.parentId;
    if (!parentId || '' === parentId) {
      const galleries: ObjectNode[] = await this.transientImageService.getImageGalleriesParents(
        objectNode,
      );
      if (!galleries || 0 === galleries.length) {
        throw ApplicationError.missing({object: IMAGE_GALLERIES_TYPE.name});
      }
      parentId = galleries[0].id as string;
    }

    let childTypeId: string | undefined = creationArguments.childTypeId;

    const refererType = await this.objectTypeService.searchById(
      objectNode.objectTypeId,
    );
    if (!refererType.definition.properties.imageGalleryObjectTreeId.oneOfTree) {
      throw ApplicationError.forbidden();
    }

    const oneOfTreeOptions: OneOfTreeOption[] = refererType.definition.properties.imageGalleryObjectTreeId.oneOfTree.filter(
      (referencedTree: OneOfTreeOption) => !referencedTree.namespaceType,
    );
    const referredTypes: string[] = oneOfTreeOptions.map(
      (oneOfTree: {treeType: string}) => oneOfTree.treeType,
    );

    let galleryTypes: string[] = [];
    for (const referredType of referredTypes) {
      galleryTypes.push(
        ...(await this.objectTypeService.getImplementingTypes(referredType)),
      );
    }
    if (!childTypeId || '' === childTypeId) {
      const parentGalleryTree: ObjectTree = (await this.insideRestService.read(
        this.uriCompleteService.getUri(EntityName.objectTree, parentId, ctx),
        ctx,
      )) as ObjectTree;
      if (!parentGalleryTree.entityCtx?.actions?.creations) {
        throw ApplicationError.missing({
          object: IMAGE_GALLERIES_TYPE.name,
          parentId: parentId,
          childType: IMAGE_GALLERY_TYPE.name,
        });
      }
      const childTypeIds = Object.keys(
        parentGalleryTree.entityCtx.actions.creations,
      );
      galleryTypes = galleryTypes.filter(
        (type) => -1 < childTypeIds.indexOf(type),
      );
      if (0 === childTypeIds.length) {
        throw ApplicationError.missing({
          object: IMAGE_GALLERIES_TYPE.name,
          parentId: parentId,
          childType: IMAGE_GALLERY_TYPE.name,
        });
      }
      childTypeId = galleryTypes[0];
    }
    if (-1 === galleryTypes.indexOf(childTypeId)) {
      throw ApplicationError.unauthorizedValue({childTypeId: childTypeId});
    }
    for (let index = oneOfTreeOptions.length - 1; index--; index >= 0) {
      if (
        -1 ===
        indexOf(
          await this.objectTypeService.getImplementingTypes(
            oneOfTreeOptions[index].treeType,
          ),
          childTypeId,
        )
      ) {
        oneOfTreeOptions.splice(index, 1);
      }
    }
    if (0 === oneOfTreeOptions.length) {
      throw ApplicationError.unauthorizedValue({childTypeId: childTypeId});
    }
    const oneOfTreeOption: OneOfTreeOption = oneOfTreeOptions[0];

    const newGallery = await this.objectNodeService.add(
      {parentNodeId: parentId, objectTypeId: childTypeId, name: name},
      CurrentContext.get(ctx),
      false,
      true,
      true,
    );
    const owner = await this.objectNodeService.getNode(
      newGallery.parentOwnerId,
      CurrentContext.get(ctx),
    );
    const namespace = await this.objectNodeService.getNode(
      newGallery.parentNamespaceId,
      CurrentContext.get(ctx),
    );
    const imageGalleryObjectTreeId = this.objectNodeDefinitionService.getTreeIdFromTreeOption(
      oneOfTreeOption,
      owner,
      namespace,
      newGallery,
    );
    await this.objectNodeService.modifyById(
      objectNode.id as string,
      {imageGalleryObjectTreeId: imageGalleryObjectTreeId},
      CurrentContext.get(ctx),
    );

    return [
      await this.actionEntityService.getEntity<ObjectTree>(
        EntityName.objectTree,
        parentId,
        CurrentContext.get(ctx, {}),
      ),
      await this.actionEntityService.getEntity<ObjectNode>(
        EntityName.objectNode,
        objectNode.id as string,
        CurrentContext.get(ctx, {}),
      ),
    ];
  }

  public async loadImageGalleryReferrerNode(
    objectNode: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<[ObjectTree, ObjectNode] | undefined> {
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

        const images: {images: Image[]; title?: string} = args as {
          images: Image[];
          title?: string;
        };
        for (const image of images.images) {
          const imageObject = await this.createImage(
            image,
            imageGalleryNode,
            ctx,
            undefined,
            images.title,
          );
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

        return [
          await this.actionEntityService.getEntity<ObjectTree>(
            EntityName.objectTree,
            imageGalleryNode.id as string,
            CurrentContext.get(ctx, {}),
          ),
          await this.actionEntityService.getEntity<ObjectNode>(
            EntityName.objectNode,
            objectNode.id as string,
            ctx,
          ),
        ];
      }
    }
  }
}
