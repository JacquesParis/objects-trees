import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {CurrentContext} from '../application.service';
import {ObjectTree} from './../../models/object-tree.model';
import {ObjectNodeService} from './../object-node/object-node.service';
import {TRANSIENT_ENTITY_PROVIDER} from './transient-entity.const';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './transient-entity.service';

export class TransientTreeService implements TransientEntityInterface {
  public providerId: string = TRANSIENT_ENTITY_PROVIDER;
  serviceId: string = TransientTreeService.name;
  description = 'Add owner, namespace, tree and aliasUri fields';
  constructor(
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectTree,
      this,
    );
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectTree: ObjectTree = entity as ObjectTree;

    if (!objectTree.treeNode.entityCtx) {
      objectTree.treeNode.entityCtx = {entityType: EntityName.objectNode};
    }
    if (objectTree.id && objectTree.uri) {
      if (objectTree.treeNode.owner) {
        objectTree.ownerType = objectTree.treeNode.objectTypeId;
        objectTree.ownerName = objectTree.treeNode.name;
        objectTree.aliasUri = objectTree.uri.replace(
          objectTree.id,
          'owner/' + objectTree.ownerType + '/' + objectTree.ownerName,
        );
      } else if (objectTree.treeNode.namespace) {
        const owner = await ctx.nodeContext.owner.getOrSetValue(async () => {
          return this.objectNodeService.searchById(
            objectTree.treeNode.parentOwnerId,
          );
        });

        objectTree.ownerType = owner.objectTypeId;
        objectTree.ownerName = owner.name;
        objectTree.namespaceType = objectTree.treeNode.objectTypeId;
        objectTree.namespaceName = objectTree.treeNode.name;
        objectTree.aliasUri = objectTree.uri.replace(
          objectTree.id,
          'namespace/' +
            objectTree.ownerType +
            '/' +
            objectTree.ownerName +
            '/' +
            objectTree.namespaceType +
            '/' +
            objectTree.namespaceName,
        );
      } else if (objectTree.treeNode.tree) {
        const owner = await ctx.nodeContext.owner.getOrSetValue(async () => {
          return this.objectNodeService.searchById(
            objectTree.treeNode.parentOwnerId,
          );
        });
        const namespace = await ctx.nodeContext.namespace.getOrSetValue(
          async () => {
            return this.objectNodeService.searchById(
              objectTree.treeNode.parentNamespaceId,
            );
          },
        );

        objectTree.ownerType = owner.objectTypeId;
        objectTree.ownerName = owner.name;
        objectTree.namespaceType = namespace.objectTypeId;
        objectTree.namespaceName = namespace.name;
        objectTree.treeType = objectTree.treeNode.objectTypeId;
        objectTree.treeName = objectTree.treeNode.name;
        objectTree.aliasUri = objectTree.uri.replace(
          objectTree.id,
          'tree/' +
            objectTree.ownerType +
            '/' +
            objectTree.ownerName +
            '/' +
            objectTree.namespaceType +
            '/' +
            objectTree.namespaceName +
            '/' +
            objectTree.treeType +
            '/' +
            objectTree.treeName,
        );
      } else {
        objectTree.nodeName = objectTree.treeNode.name;
        objectTree.nodeType = objectTree.treeNode.objectTypeId;
      }
    }

    objectTree.treeNode.entityCtx.loaded = false;
    for (const child of objectTree.children) {
      if (!child.treeNode.tree) {
        await this.transientEntityService.completeReturnedEntity(
          EntityName.objectTree,
          child,
          new CurrentContext(),
        );
      } else {
        if (!child.entityCtx) {
          child.entityCtx = {entityType: EntityName.objectTree};
        }
        child.entityCtx.loaded = false;
      }
    }
  }
}
