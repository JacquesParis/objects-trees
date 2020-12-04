import {service} from '@loopback/core';
import * as _ from 'lodash';
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
import {ObjectTreeInit} from './object-tree.init';

export class ObjectTreeService {
  public get ready(): Promise<void> {
    return this.init.ready;
  }
  private init: ObjectTreeInit;
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
    this.init = new ObjectTreeInit(
      objectNodeService,
      objectTypeService,
      contentEntityService,
      appCtx,
    );
  }

  private async createNewApplicationSubTree(
    parentNode: ObjectNode,
    treeNodeName: string,
    treeNodeTypeId: string,
    tree: ObjectTreeDefinition,
  ): Promise<ObjectNode> {
    const treeNode: ObjectNode = await this.objectNodeService.add(
      _.merge(tree.treeNode, {
        name: treeNodeName,
        objectTypeId: treeNodeTypeId,
        parentNodeId: parentNode.id,
      }),
      CurrentContext.get({
        nodeContext: {parent: new ExpectedValue(parentNode)},
      }),
    );
    for (const childTypeId in tree.children) {
      for (const childName in tree.children[childTypeId]) {
        for (const childTree of tree.children[childTypeId][childName]) {
          await this.createNewApplicationSubTree(
            treeNode,
            childName,
            childTypeId,
            childTree,
          );
        }
      }
    }
    return treeNode;
  }

  private async updateApplicationSubTree(
    treeNode: ObjectNode,
    tree: ObjectTreeDefinition,
  ): Promise<ObjectNode> {
    if (0 < Object.keys(tree.treeNode).length) {
      treeNode = await this.objectNodeService.modifyById(
        treeNode.id as string,
        tree.treeNode,
        CurrentContext.get({nodeContext: {node: new ExpectedValue(treeNode)}}),
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
          );
          index++;
        }
        while (index < tree.children[childTypeId][childName].length) {
          await this.createNewApplicationSubTree(
            treeNode,
            childName,
            childTypeId,
            tree.children[childTypeId][childName][index],
          );
          index++;
        }
        while (index < existingChildren.length) {
          await this.objectNodeService.removeById(
            existingChildren[index].id as string,
            CurrentContext.get({
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
      );
    }

    if (1 < treeNodes.length) {
      throw ApplicationError.corruptedData({
        treeNodeName,
        treeNodeTypeId,
        'treeNode.length': treeNodes.length,
      });
    }

    return this.updateApplicationSubTree(treeNodes[0], tree);
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
        return this.objectNodeService.searchTreeNode(
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

  public async gettNamespaceTree(
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
    return _.concat(root, await this.objectNodeService.searchByTreeId(treeId));
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
