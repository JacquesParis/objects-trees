import {IMoveToAction, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {cloneDeep, filter, indexOf, map, omit} from 'lodash';
import {EntityName} from '../../models';
import {CurrentContext} from '../application.service';
import {ObjectTree} from './../../models/object-tree.model';
import {ApplicationService} from './../application.service';
import {InsideRestService} from './../inside-rest/inside-rest.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {UriCompleteService} from './../uri-complete/uri-complete.service';
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
    @service(ApplicationService) private applicationService: ApplicationService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectTree,
      this,
    );
  }

  async addOwnerNamespaceTreeAndAliasUriFields(
    objectTree: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
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
  }

  async addMoveToActions(
    objectTree: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    if (!ctx.uriContext.mainContext) {
      return;
    }
    let rootTree = objectTree;
    const uriCompleteService: UriCompleteService = await this.applicationService.app.getService<UriCompleteService>(
      UriCompleteService,
    );
    if (!objectTree.treeNode.tree) {
      const insideRestService: InsideRestService = await this.applicationService.app.getService<InsideRestService>(
        InsideRestService,
      );
      rootTree = (await insideRestService.read(
        uriCompleteService.getUri(
          EntityName.objectTree,
          objectTree.treeNode.parentTreeId,
          ctx,
        ),
        ctx,
      )) as ObjectTree;
    }
    const moveTo: {
      [objectSourceTypeId: string]: (IMoveToAction & {
        ignoredNodeIds: string[];
      })[];
    } = this.buildMoveToList(rootTree, uriCompleteService, ctx);
    this.addMoveTo(objectTree, moveTo);
  }

  private addMoveTo(
    objectTree: ObjectTree,
    moveTo: {
      [objectSourceTypeId: string]: (IMoveToAction & {
        ignoredNodeIds: string[];
      })[];
    },
  ) {
    if (objectTree.treeNode.objectTypeId in moveTo) {
      const targets: IMoveToAction[] = map(
        filter(
          moveTo[objectTree.treeNode.objectTypeId],
          (target) =>
            objectTree.treeNode.parentNodeId !== target.id &&
            -1 === indexOf(target.ignoredNodeIds, objectTree.id),
        ),
        (target) => omit(target, ['ignoredNodeIds']),
      );
      if (0 < targets.length) {
        if (!objectTree.entityCtx) {
          objectTree.entityCtx = {entityType: EntityName.objectTree};
        }
        if (!objectTree.entityCtx.actions) {
          objectTree.entityCtx.actions = {};
        }
        objectTree.entityCtx.actions.moveTo = targets;
      }
    }
    if (objectTree.children) {
      for (const child of objectTree.children) {
        this.addMoveTo(child, moveTo);
      }
    }
  }

  private buildMoveToList(
    objectTree: ObjectTree,
    uriCompleteService: UriCompleteService,
    ctx: CurrentContext,
    moveTo: {
      [objectSourceTypeId: string]: (IMoveToAction & {
        ignoredNodeIds: string[];
      })[];
    } = {},
    ignoredNodeIds: string[] = [],
  ): {
    [objectSourceTypeId: string]: (IMoveToAction & {
      ignoredNodeIds: string[];
    })[];
  } {
    ignoredNodeIds.push(objectTree.id);
    if (objectTree.entityCtx?.actions?.creations) {
      for (const creationTypeId of Object.keys(
        objectTree.entityCtx.actions.creations,
      )) {
        if (!(creationTypeId in moveTo)) {
          moveTo[creationTypeId] = [];
        }
        moveTo[creationTypeId].push({
          id: objectTree.id,
          uri: uriCompleteService.getUri(
            EntityName.objectTree,
            objectTree.id,
            ctx,
          ),
          nodeName: objectTree.treeNode.name,
          nodeType: objectTree.treeNode.objectTypeId,
          preview: objectTree.entityCtx.preview,
          ignoredNodeIds: ignoredNodeIds,
        });
      }
    }
    if (objectTree.children) {
      for (const child of objectTree.children) {
        this.buildMoveToList(
          child,
          uriCompleteService,
          ctx,
          moveTo,
          cloneDeep(ignoredNodeIds),
        );
      }
    }
    return moveTo;
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectTree: ObjectTree = entity as ObjectTree;

    await this.addOwnerNamespaceTreeAndAliasUriFields(objectTree, ctx);
    await this.addMoveToActions(objectTree, ctx);

    if (!objectTree.treeNode.entityCtx) {
      objectTree.treeNode.entityCtx = {entityType: EntityName.objectNode};
    }

    objectTree.treeNode.entityCtx.loaded = false;
    for (const child of objectTree.children) {
      if (!child.treeNode.tree) {
        await this.transientEntityService.completeReturnedEntity(
          EntityName.objectTree,
          child,
          CurrentContext.get(ctx, {}),
        );
      } else {
        if (!child.entityCtx) {
          child.entityCtx = {entityType: EntityName.objectTree};
        }
        child.entityCtx.loaded = false;
        if (child.treeNode?.entityCtx) {
          child.treeNode.entityCtx.loaded = false;
        }
      }
    }
  }
}
