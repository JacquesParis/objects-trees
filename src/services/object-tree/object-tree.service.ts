import {service} from '@loopback/core';
import * as _ from 'lodash';
import {find, indexOf} from 'lodash';
import {ObjectTreeDefinition} from '../../integration/extension.provider';
import {ObjectNode} from '../../models';
import {ObjectTree} from '../../models/object-tree.model';
import {
  ApplicationService,
  CurrentContext,
  ExpectedValue,
} from '../application.service';
import {ContentEntityService} from '../content-entity/content-entity.service';
import {ObjectNodeService} from '../object-node/object-node.service';
import {ObjectTypeService} from '../object-type.service';
import {ApplicationError} from './../../helper/application-error';
import {EntityName} from './../../models/entity-name';
import {EntityActionType} from './../application.service';
import {OBJECT_TREE_PROVIDER} from './object-tree.const';

export class ObjectTreeService {
  public get ready(): Promise<void> {
    return this.appCtx.getExtensionContext(OBJECT_TREE_PROVIDER).ready;
  }
  /*
  private init: ObjectTreeInit;*/
  constructor(
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(ApplicationService)
    private appCtx: ApplicationService,
  ) {
    this.appCtx.entityActions['ObjectTreeController.prototype.findChildren'] = {
      entityName: EntityName.objectTree,
      entityActionType: EntityActionType.read,
    };
    this.appCtx.entityActions[
      'ObjectTreeController.prototype.findOwnerTree'
    ] = {
      entityName: EntityName.objectTree,
      entityActionType: EntityActionType.read,
    };
    this.appCtx.entityActions['ObjectTreeController.prototype.findTree'] = {
      entityName: EntityName.objectTree,
      entityActionType: EntityActionType.read,
    };
    this.appCtx.entityActions[
      'ObjectTreeController.prototype.findNamespaceTree'
    ] = {
      entityName: EntityName.objectTree,
      entityActionType: EntityActionType.read,
    };
    this.appCtx.entityActions['ObjectTreeController.prototype.findNode'] = {
      entityName: EntityName.objectTree,
      entityActionType: EntityActionType.read,
    };
  }

  private async createNewApplicationSubTree(
    parentNode: ObjectNode,
    treeNodeName: string,
    treeNodeTypeId: string,
    tree: ObjectTreeDefinition,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    const treeNode: ObjectNode = await this.objectNodeService.add(
      _.merge(tree.treeNode, {
        name: treeNodeName,
        objectTypeId: treeNodeTypeId,
        parentNodeId: parentNode.id,
      }),
      CurrentContext.get(ctx, {
        nodeContext: {parent: new ExpectedValue(parentNode)},
      }),
      false,
      false,
    );
    for (const childTypeId in tree.children) {
      for (const childName in tree.children[childTypeId]) {
        for (const childTree of tree.children[childTypeId][childName]) {
          await this.createNewApplicationSubTree(
            treeNode,
            childName,
            childTypeId,
            childTree,
            ctx,
          );
        }
      }
    }
    return treeNode;
  }

  private async updateApplicationSubTree(
    treeNode: ObjectNode,
    tree: ObjectTreeDefinition,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    if (0 < Object.keys(tree.treeNode).length) {
      treeNode = await this.objectNodeService.modifyById(
        treeNode.id as string,
        tree.treeNode,
        CurrentContext.get(ctx, {
          nodeContext: {node: new ExpectedValue(treeNode)},
        }),
      );
    }

    for (const childTypeId in tree.children) {
      for (const childName in tree.children[childTypeId]) {
        const existingChildren = await this.objectNodeService.searchByParentIdAndObjectTypeId(
          treeNode.id as string,
          childTypeId,
          childName,
        );
        let index = 0;
        while (
          index < tree.children[childTypeId][childName].length &&
          index < existingChildren.length
        ) {
          await this.updateApplicationSubTree(
            existingChildren[index],
            tree.children[childTypeId][childName][index],
            ctx,
          );
          index++;
        }
        while (index < tree.children[childTypeId][childName].length) {
          await this.createNewApplicationSubTree(
            treeNode,
            childName,
            childTypeId,
            tree.children[childTypeId][childName][index],
            ctx,
          );
          index++;
        }
        while (index < existingChildren.length) {
          await this.objectNodeService.removeById(
            existingChildren[index].id as string,
            CurrentContext.get(ctx, {
              nodeContext: {node: new ExpectedValue(existingChildren[index])},
            }),
          );
          index++;
        }
      }
    }
    return treeNode;
  }

  public async registerApplicationTree(
    parentNode: ObjectNode,
    treeNodeName: string,
    treeNodeTypeId: string,
    tree: ObjectTreeDefinition,
    reset: boolean,
    ctx: CurrentContext = new CurrentContext(),
  ): Promise<ObjectNode> {
    if (!parentNode) {
      throw ApplicationError.notFound({
        treeNodeName,
        treeNodeTypeId,
        missing: 'parentNode',
      });
    }
    const treeNodes = await this.objectNodeService.searchByParentIdAndObjectTypeId(
      parentNode.id as string,
      treeNodeTypeId,
      treeNodeName,
    );
    if (!treeNodes || 0 === treeNodes.length) {
      return this.createNewApplicationSubTree(
        parentNode,
        treeNodeName,
        treeNodeTypeId,
        tree,
        ctx,
      );
    }

    if (1 < treeNodes.length) {
      throw ApplicationError.corruptedData({
        treeNodeName,
        treeNodeTypeId,
        'treeNode.length': treeNodes.length,
      });
    }

    if (reset) {
      await this.objectNodeService.removeById(
        treeNodes[0].id as string,
        CurrentContext.get(ctx, {
          nodeContext: {
            node: new ExpectedValue(treeNodes[0]),
            parent: new ExpectedValue(parentNode),
          },
        }),
      );
      return this.createNewApplicationSubTree(
        parentNode,
        treeNodeName,
        treeNodeTypeId,
        tree,
        ctx,
      );
    }

    return this.updateApplicationSubTree(treeNodes[0], tree, ctx);
  }

  /*
   * Add service methods here
   */

  public async getOwnerTreeNodes(
    ownerType: string,
    ownerName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const tree: ObjectNode = await ctx.treeContext.treeNode.getOrSetValue(
      async () => {
        return this.objectNodeService.searchOwner(ownerType, ownerName);
      },
    );
    if (!tree) {
      throw ApplicationError.notFound({owner: ownerType, ownerName: ownerName});
    }

    return _.concat(
      tree,
      await this.objectNodeService.searchByTreeId(<string>tree.id),
    );
  }

  public async buildTreeFromNodes(
    treeNode: ObjectNode,
    availableNodes: ObjectNode[],
    ctx: CurrentContext,
  ) {
    return new ObjectTree(treeNode).init(
      availableNodes,
      //      this.contentEntityService,
      //   await this.objectTypeService.getAll(ctx),
    );
  }

  public async getOwnerTree(
    ownerType: string,
    ownerName: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getOwnerTreeNodes(ownerType, ownerName, ctx);
    return this.buildTreeFromNodes(objectNodes[0], objectNodes, ctx);
  }

  public async getTreeNodes(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const tree: ObjectNode = await ctx.treeContext.treeNode.getOrSetValue(
      async () => {
        return this.objectNodeService.searchTree(
          ownerType,
          ownerName,
          namespaceType,
          namespaceName,
          treeType,
          treeName,
        );
      },
    );
    if (!tree) {
      throw ApplicationError.notFound({
        tree: treeType,
        treeName: treeName,
        namespace: namespaceType,
        namespaceName: namespaceName,
        owner: ownerType,
        ownerName: ownerName,
      });
    }

    return _.concat(
      tree,
      await this.objectNodeService.searchByTreeId(<string>tree.id),
    );
  }

  public async getTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getTreeNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
      ctx,
    );
    return this.buildTreeFromNodes(objectNodes[0], objectNodes, ctx);
  }

  public async getNode(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
    nodeType: string,
    nodeName: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes: ObjectNode[] = await this.getTreeNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
      ctx,
    );
    const types = await this.objectTypeService.getImplementingTypes(nodeType);
    const treeNode = find(
      objectNodes,
      (node) =>
        node.name === nodeName && -1 < indexOf(types, node.objectTypeId),
    );
    if (!treeNode) {
      throw ApplicationError.notFound({
        node: nodeType,
        nodeName: nodeName,
        tree: treeType,
        treeName: treeName,
        namespace: namespaceType,
        namespaceName: namespaceName,
        owner: ownerType,
        ownerName: ownerName,
      });
    }
    return this.buildTreeFromNodes(treeNode, objectNodes, ctx);
  }

  public async getNamespaceNodes(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const namespace: ObjectNode = await ctx.treeContext.treeNode.getOrSetValue(
      async () => {
        return this.objectNodeService.searchNamespace(
          ownerType,
          ownerName,
          namespaceType,
          namespaceName,
        );
      },
    );
    if (!namespace) {
      throw ApplicationError.notFound({
        namespace: namespaceType,
        namespaceName: namespaceName,
        owner: ownerType,
        ownerName: ownerName,
      });
    }

    return _.concat(
      namespace,
      await this.objectNodeService.searchByTreeId(<string>namespace.id),
    );
  }

  public async getNamespaceTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getNamespaceNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      ctx,
    );
    return this.buildTreeFromNodes(objectNodes[0], objectNodes, ctx);
  }

  public async getChildrenByImplementedTypeId(
    tree: ObjectTree,
  ): Promise<{
    [objectTypeId: string]: ObjectTree[];
  }> {
    const result: {[objectTypeId: string]: ObjectTree[]} = {};

    for (const child of tree.children) {
      const implementedTypes: string[] = await this.objectTypeService.getImplementedTypes(
        child.treeNode.objectTypeId,
      );
      for (const implementedType of implementedTypes) {
        if (!(implementedType in result)) {
          result[implementedType] = [];
        }
        result[implementedType].push(child);
      }
    }
    return result;
  }

  public async loadChildrenNodes(
    treeId: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    const root = await ctx.treeContext.treeNode.getOrSetValue(async () => {
      return this.objectNodeService.searchById(treeId);
    });
    if (!root) {
      throw ApplicationError.notFound({
        tree: treeId,
      });
    }
    return this.objectNodeService.loadChildrenNodes(root);
  }

  public async loadTree(
    treeId: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.loadChildrenNodes(treeId, ctx);
    return this.buildTreeFromNodes(objectNodes[0], objectNodes, ctx);
  }

  public isInTree(tree: ObjectTree, node: ObjectNode): boolean {
    if (node.id === tree.treeNode.id) {
      return true;
    }
    for (const child of tree.children) {
      if (this.isInTree(child, node)) {
        return true;
      }
    }
    return false;
  }
  public getChildOfType(tree: ObjectTree, objectTypeId: string): ObjectTree {
    for (const child of tree.children) {
      if (child.treeNode.objectTypeId === objectTypeId) {
        return child;
      }
    }
    return (null as unknown) as ObjectTree;
  }
}
