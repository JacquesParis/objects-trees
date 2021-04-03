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
import {ObjectTypeService} from './../../services/object-type.service';
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
  }

  protected createImage(
    image: Image,
    parent: ObjectNode,
    ctx: CurrentContext,
    parentType?: ObjectType,
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

    return this.objectNodeService.add(
      {
        name: nameParts.join('.'),
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
    const images: {images: Image[]} = args as {images: Image[]};
    for (const image of images.images) {
      await this.createImage(
        image,
        ctx.nodeContext.node.value,
        ctx,
        ctx.nodeContext.objectType.value,
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
      name = objectNode.name;
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

    let oneOfTreeOptions: OneOfTreeOption[] = refererType.definition.properties.imageGalleryObjectTreeId.oneOfTree.filter(
      (referencedTree: OneOfTreeOption) => !referencedTree.namespaceType,
    );
    const referredTypes: string[] = oneOfTreeOptions.map(
      (oneOfTree: {treeType: string}) => oneOfTree.treeType,
    );

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
      const galleryTypes: string[] = (
        await this.objectTypeService.getImplementingTypes(
          IMAGE_GALLERY_TYPE.name,
        )
      )
        .filter((type) => -1 < childTypeIds.indexOf(type))
        .filter((type) => -1 < referredTypes.indexOf(type));
      if (0 === childTypeIds.length) {
        throw ApplicationError.missing({
          object: IMAGE_GALLERIES_TYPE.name,
          parentId: parentId,
          childType: IMAGE_GALLERY_TYPE.name,
        });
      }
      childTypeId = galleryTypes[0];
    }
    if (-1 === referredTypes.indexOf(childTypeId)) {
      throw ApplicationError.unauthorizedValue({childTypeId: childTypeId});
    }
    oneOfTreeOptions = oneOfTreeOptions.filter(
      (referencedTree: {treeType: string}) =>
        referencedTree.treeType === childTypeId,
    );
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

        const images: {images: Image[]} = args as {images: Image[]};
        for (const image of images.images) {
          const imageObject = await this.createImage(
            image,
            imageGalleryNode,
            ctx,
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
