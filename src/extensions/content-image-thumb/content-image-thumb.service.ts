/* eslint-disable no-empty */
import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {assign} from 'lodash';
import {Metadata, Sharp} from 'sharp';
import {EntityName} from '../../models';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {AccessRightsCRUD} from './../../services/access-rights/access-rights.const';
import {
  CurrentContext,
  EntityActionType,
  ExpectedValue,
} from './../../services/application.service';
import {NodeInterceptService} from './../../services/entity-intercept/node-intercept.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {
  ObjectNodeService,
  ParentNodeType,
} from './../../services/object-node/object-node.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {IMAGE_TYPE} from './../content-image/content-image.const';
import {ContentImageService} from './../content-image/content-image.definition';
import {ImageTree} from './../content-image/content-image.interface';
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
    @service(NodeInterceptService)
    private nodeInterceptService: NodeInterceptService,
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

    /*
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Build images Thumb and Web version',
      EntityName.objectTree,
      IMAGE_GALLERY_TYPE.name,
      this.completeImageGalleryTree.bind(this),
    );
    */
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Build image Thumb and Web version',
      EntityName.objectTree,
      IMAGE_TYPE.name,
      this.completeImageTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Change thumb image Access Rights',
      EntityName.objectTree,
      IMAGE_THUMB_TYPE.name,
      this.completeImageThumbAndImageOriginalNodeOrTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Change original image Access Rights',
      EntityName.objectTree,
      IMAGE_ORIGINAL_TYPE.name,
      this.completeImageThumbAndImageOriginalNodeOrTree.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Change thumb image Access Rights',
      EntityName.objectNode,
      IMAGE_THUMB_TYPE.name,
      this.completeImageThumbAndImageOriginalNodeOrTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Change original image Access Rights',
      EntityName.objectNode,
      IMAGE_ORIGINAL_TYPE.name,
      this.completeImageThumbAndImageOriginalNodeOrTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Trigger on POST, PUT and PATCH thumb and web image generation',
      EntityName.objectNode,
      IMAGE_TYPE.name,
      this.completeImageNode.bind(this),
      ['PATCH', 'POST', 'PUT'],
    );

    this.nodeInterceptService.registerEntityInterceptorService(
      CONTENT_IMAGE_THUMB_PROVIDER,
      ContentImageThumbService.name,
      'Delete image Thumb and Original version',
      IMAGE_TYPE.name,
      EntityActionType.update,
      this.interceptImageNodeUpdate.bind(this),
    );
  }

  public async interceptImageNodeUpdate(
    entityId: string | undefined,
    entity: ObjectNode,
    requestEntity: Partial<ObjectNode>,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity> {
    await this.objectNodeService.removeByParent(
      ParentNodeType.node,
      entityId ? entityId : (entity.id as string),
      ctx,
    );
    return true;
  }

  public async completeImageNode(image: ObjectNode, ctx: CurrentContext) {
    if (image.uri) {
      await this.insideRestService.read(
        image.uri?.replace('object-nodes', 'object-trees'),
        ctx,
        true,
      );
    }
  }

  public async completeImageThumbAndImageOriginalNodeOrTree(
    image: ObjectNode | ObjectTree,
    ctx: CurrentContext,
  ) {
    const rights: AccessRightsCRUD | undefined =
      image.entityCtx?.aclCtx?.rights;
    if (rights) {
      rights.create = false;
      rights.delete = false;
      rights.update = false;
    }
    if (image.treeNode) {
      const nodeRights: AccessRightsCRUD | undefined =
        image.treeNode.entityCtx?.aclCtx?.rights;
      if (nodeRights) {
        nodeRights.create = false;
        nodeRights.delete = false;
        nodeRights.update = false;
      }
    }
  }

  public async completeImageTree(
    imageTree: ImageTree,
    ctx: CurrentContext,
  ): Promise<void> {
    /*
    await this._completeImageTree(image, ctx);
  }

  private async _completeImageTree(
    image: ImageTree,
    ctx: CurrentContext,
    reloadTree = true,
  ): Promise<boolean> {*/
    let hasNewNodes = false;
    if (!(IMAGE_ORIGINAL_TYPE.name in imageTree.childrenByObjectTypeId)) {
      await this.contentImageService.addTransientContent(imageTree.treeNode);
      if (
        !imageTree.treeNode.contentImage ||
        !imageTree.treeNode.contentImage.base64
      ) {
        //return hasNewNodes;
        return;
      }
      try {
        await this.objectNodeService.add(
          {
            name: 'original',
            parentNodeId: imageTree.treeNode.id,
            objectTypeId: IMAGE_ORIGINAL_TYPE.name,
            contentImage: {
              base64: imageTree.treeNode.contentImage.base64,
              size: imageTree.treeNode.contentImage.size,
              name: imageTree.treeNode.contentImage.name,
              type: imageTree.treeNode.contentImage.type,
            },
          },
          CurrentContext.get({
            nodeContext: {
              parent: new ExpectedValue<ObjectNode>(imageTree.treeNode),
            },
          }),
        );
      } catch (error) {}
      hasNewNodes = true;
      const newSize = await this.changeImgSize(
        imageTree.treeNode.contentImage,
        800,
      );
      await this.objectNodeService.modifyById(
        imageTree.treeNode.id as string,
        {
          contentImage: {
            base64: newSize.base64,
            size: newSize.size,
            name: imageTree.treeNode.contentImage.name,
            type: imageTree.treeNode.contentImage.type,
          },
        },
        CurrentContext.get({
          nodeContext: {
            node: new ExpectedValue<ObjectNode>(imageTree.treeNode),
          },
        }),
      );
    }
    if (!(IMAGE_THUMB_TYPE.name in imageTree.childrenByObjectTypeId)) {
      if (
        !imageTree.treeNode.contentImage ||
        !imageTree.treeNode.contentImage.base64
      ) {
        await this.contentImageService.addTransientContent(imageTree.treeNode);
      }
      if (
        !imageTree.treeNode.contentImage ||
        !imageTree.treeNode.contentImage.base64
      ) {
        //   return hasNewNodes;
        return;
      }
      hasNewNodes = true;
      const newSize = await this.changeImgSize(
        imageTree.treeNode.contentImage,
        200,
      );
      try {
        await this.objectNodeService.add(
          {
            name: 'thumb',
            parentNodeId: imageTree.treeNode.id,
            objectTypeId: IMAGE_THUMB_TYPE.name,
            contentImage: {
              base64: newSize.base64,
              size: newSize.size,
              name: imageTree.treeNode.contentImage.name,
              type: imageTree.treeNode.contentImage.type,
            },
          },
          CurrentContext.get({
            nodeContext: {
              parent: new ExpectedValue<ObjectNode>(imageTree.treeNode),
            },
          }),
        );
      } catch (error) {}
    }

    //   if (reloadTree && hasNewNodes) {
    if (hasNewNodes) {
      const newImage = await this.insideRestService.read(
        imageTree.uri,
        ctx,
        true,
      );
      assign(imageTree, newImage);
    } else {
      imageTree.thumb =
        imageTree.childrenByObjectTypeId[IMAGE_THUMB_TYPE.name][0].treeNode;
      imageTree.original =
        imageTree.childrenByObjectTypeId[IMAGE_ORIGINAL_TYPE.name][0].treeNode;
      const treeRights: AccessRightsCRUD | undefined =
        imageTree.childrenByObjectTypeId[IMAGE_THUMB_TYPE.name][0].entityCtx
          ?.aclCtx?.rights;
      if (treeRights) {
        treeRights.create = false;
        treeRights.delete = false;
        treeRights.update = false;
      }
      const nodeRights: AccessRightsCRUD | undefined =
        imageTree.childrenByObjectTypeId[IMAGE_THUMB_TYPE.name][0].treeNode
          .entityCtx?.aclCtx?.rights;
      if (nodeRights) {
        nodeRights.create = false;
        nodeRights.delete = false;
        nodeRights.update = false;
      }
    }
    //return hasNewNodes;
    return;
  }

  public async completeImageGalleryTree(
    imageGallery: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    // let hasNewNodes = false;
    for (const image of imageGallery.children) {
      /*
      hasNewNodes =
        hasNewNodes ||
        (await this._completeImageTree(image as ImageTree, ctx, false));*/
      await this.completeImageTree(image as ImageTree, ctx);
    }
    /*
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
    }*/
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
      if (maxSize <= size) {
        return contentImage;
      }
      width = Math.ceil((metadata.width * size) / maxSize);
      height = Math.ceil((metadata.height * size) / maxSize);
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
