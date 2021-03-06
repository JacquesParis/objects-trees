import {service} from '@loopback/core';
import {
  DataObject,
  Entity,
  Filter,
  FilterExcludingWhere,
  Options,
  repository,
  Where,
} from '@loopback/repository';
import {concat, find, indexOf, isArray, merge, pick, some} from 'lodash';
import {toKebabCase, toStartCase} from '../../helper';
import {ApplicationError} from '../../helper/application-error';
import {EntityName} from '../../models';
import {ObjectNodeRelations} from '../../models/object-node.model';
import {ObjectSubType} from '../../models/object-sub-type.model';
import {ObjectType} from '../../models/object-type.model';
import {ObjectNodeRepository} from '../../repositories';
import {
  CurrentContext,
  EntityActionType,
  ExpectedValue,
} from '../application.service';
import {ContentEntityService} from '../content-entity/content-entity.service';
import {ObjectTypeService} from '../object-type.service';
import {ObjectNode} from './../../models/object-node.model';
import {ApplicationService, NodeContext} from './../application.service';

export enum ParentNodeType {
  node = 'node',
  tree = 'tree',
  owner = 'owner',
  namespace = 'namespace',
}

export class ObjectNodeService {
  constructor(
    @repository(ObjectNodeRepository)
    private objectNodeRepository: ObjectNodeRepository,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(ApplicationService) private applicationService: ApplicationService,
  ) {
    this.applicationService.entityActions[
      'ObjectNodeController.prototype.create'
    ] = {
      entityName: EntityName.objectNode,
      entityActionType: EntityActionType.create,
    };
    this.applicationService.entityActions[
      'ObjectNodeController.prototype.updateById'
    ] = {
      entityName: EntityName.objectNode,
      entityActionType: EntityActionType.update,
    };
    this.applicationService.entityActions[
      'ObjectNodeController.prototype.deleteById'
    ] = {
      entityName: EntityName.objectNode,
      entityActionType: EntityActionType.delete,
    };
    this.applicationService.entityActions[
      'ObjectNodeController.prototype.findById'
    ] = {
      entityName: EntityName.objectNode,
      entityActionType: EntityActionType.read,
    };
  }

  public async migrate(
    parentType: string,
    previousType: string,
    newType: string,
  ) {
    const whereParents: Where<ObjectNode> = {objectTypeId: parentType};
    const whereChildren: Where<ObjectNode> = {
      parentNodeId: {
        inq: (await this.objectNodeRepository.find({where: whereParents})).map(
          (node) => node.id,
        ),
      },
      objectTypeId: previousType,
    };
    await this.objectNodeRepository.updateAll(
      {objectTypeId: newType},
      whereChildren,
    );
  }

  public findOrderedNodes(filter: Filter<ObjectNode>): Promise<ObjectNode[]> {
    const orderedFilter: Filter<ObjectNode> = merge(
      {order: ['index ASC']},
      filter,
    );
    return this.objectNodeRepository.find(orderedFilter);
  }

  public searchByParentTreeId(
    treeId: string,
    options: {
      objectTypeId?: string;
      name?: string;
      objectTypeIds?: string[];
    } = {},
  ): Promise<ObjectNode[]> {
    return this.searchByOneParentId('Tree', treeId, options);
  }

  public searchByParentNamespaceId(
    treeId: string,
    options: {
      objectTypeId?: string;
      name?: string;
      objectTypeIds?: string[];
    } = {},
  ): Promise<ObjectNode[]> {
    return this.searchByOneParentId('Namespace', treeId, options);
  }

  public searchByOneParentId(
    parentType: 'Tree' | 'Namespace' | 'Node' | 'Owner',
    parentId: string,
    options: {
      objectTypeId?: string;
      name?: string;
      objectTypeIds?: string[];
    } = {},
  ): Promise<ObjectNode[]> {
    const where: Where<ObjectNode> = {['parent' + parentType + 'Id']: parentId};
    if (options.objectTypeId) {
      where.objectTypeId = options.objectTypeId;
    }
    if (options.name) {
      where.name = options.name;
    }
    if (options.objectTypeIds) {
      where.objectTypeId = {inq: options.objectTypeIds};
    }
    return this.findOrderedNodes({where});
  }

  public searchByTreeIds(treeIds: string[]): Promise<ObjectNode[]> {
    return this.findOrderedNodes({
      where: {parentTreeId: {inq: treeIds}},
    });
  }

  public searchByParentNodeId(
    parentNodeId: string,
    options: {
      objectTypeId?: string;
      name?: string;
      objectTypeIds?: string[];
    } = {},
  ): Promise<ObjectNode[]> {
    return this.searchByOneParentId('Node', parentNodeId, options);
  }

  public searchByParentIdsAndObjectTypeId(
    parentNodeIds: string[],
    objectTypeId: string,
  ): Promise<ObjectNode[]> {
    return this.findOrderedNodes({
      where: {parentNodeId: {inq: parentNodeIds}, objectTypeId},
    });
  }

  public async searchOwner(
    ownerType: string,
    ownerName: string,
  ): Promise<ObjectNode> {
    const types: string[] = await this.objectTypeService.getImplementingTypes(
      ownerType,
    );
    const nodes = await this.findOrderedNodes({
      where: {objectTypeId: {inq: types}, name: ownerName, owner: true},
    });
    if (1 < nodes.length) {
      throw ApplicationError.tooMany({owner: ownerType, ownerName: ownerName});
    }
    return 1 === nodes.length ? nodes[0] : <ObjectNode>(<unknown>null);
  }

  public async searchNamespace(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
  ): Promise<ObjectNode> {
    const owner: ObjectNode = await this.searchOwner(ownerType, ownerName);
    if (!owner) {
      throw ApplicationError.notFound({owner: ownerType, ownerName: ownerName});
    }
    const namespace = await this.searchNamespaceOfOwnerId(
      owner.id as string,
      namespaceType,
      namespaceName,
      {
        owner: ownerType,
        ownerName: ownerName,
      },
    );
    if (
      !namespace &&
      ownerType === namespaceType &&
      ownerName === namespaceName
    ) {
      return owner;
    }
    return namespace;
  }

  public async searchNamespaceOfOwnerId(
    ownerId: string,
    namespaceType: string,
    namespaceName: string,
    errorContext = {},
  ): Promise<ObjectNode> {
    const types: string[] = await this.objectTypeService.getImplementingTypes(
      namespaceType,
    );
    const nodes = await this.findOrderedNodes({
      where: {
        objectTypeId: {inq: types},
        name: namespaceName,
        parentOwnerId: ownerId,
        namespace: true,
      },
    });
    if (1 < nodes.length) {
      throw ApplicationError.tooMany(
        merge({ownerId: ownerId}, errorContext, {
          namespace: namespaceType,
          namespaceName: namespaceName,
        }),
      );
    }
    return 1 === nodes.length ? nodes[0] : <ObjectNode>(<unknown>null);
  }

  public async searchTreeOfNamespaceId(
    namespaceId: string,
    treeType: string,
    treeName: string,
    errorContext = {},
  ): Promise<ObjectNode> {
    const nodes = await this.findOrderedNodes({
      where: {
        objectTypeId: treeType,
        name: treeName,
        parentNamespaceId: namespaceId,
        tree: true,
      },
    });
    if (1 < nodes.length) {
      throw ApplicationError.tooMany(
        merge({namespaceId}, errorContext, {
          tree: treeType,
          treeName: treeName,
        }),
      );
    }
    return 1 === nodes.length ? nodes[0] : <ObjectNode>(<unknown>null);
  }

  public async getOrCreateChildren(
    parentId: string,
    objectTypeId: string,
    defaultValue?: DataObject<ObjectNode>,
    min = 1,
    ctx: CurrentContext = new CurrentContext(),
  ): Promise<ObjectNode[]> {
    const children = await this.searchByParentNodeId(parentId, {objectTypeId});
    if (defaultValue && children.length < min) {
      while (children.length < min) {
        children.push(
          await this.add(
            merge({}, defaultValue, {
              parentNodeId: parentId,
              objectTypeId: objectTypeId,
            }),
            CurrentContext.get(ctx, {}),
            false,
            true,
            true,
          ),
        );
      }
    }
    return children;
  }

  public async searchTreesOfNamespaceId(
    namespaceId: string,
    treeType: string,
    errorContext = {},
  ): Promise<ObjectNode[]> {
    const types: string[] = await this.objectTypeService.getImplementingTypes(
      treeType,
    );
    return this.findOrderedNodes({
      where: {
        objectTypeId: {inq: types},
        parentNamespaceId: namespaceId,
        tree: true,
      },
    });
  }

  public async searchTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
  ): Promise<ObjectNode> {
    const namespace: ObjectNode = await this.searchNamespace(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
    );
    if (!namespace) {
      throw ApplicationError.notFound({
        namespace: namespaceType,
        namespaceType,
      });
    }

    const types: string[] = await this.objectTypeService.getImplementingTypes(
      treeType,
    );
    const nodes = await this.findOrderedNodes({
      where: {
        objectTypeId: {inq: types},
        name: treeName,
        parentNamespaceId: namespace.id,
        tree: true,
      },
    });
    if (1 < nodes.length) {
      throw ApplicationError.tooMany({
        namespace: namespaceType,
        namespaceName: namespaceName,
        owner: ownerType,
        ownerName: ownerName,
      });
    }

    if (
      0 === nodes.length &&
      treeType === namespaceType &&
      treeName === namespaceName
    ) {
      return namespace;
    }

    return 1 === nodes.length ? nodes[0] : <ObjectNode>(<unknown>null);
  }

  public async getNode(id: string, ctx: CurrentContext): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
      return this.searchById(id);
    });
  }

  public async getOwner(
    ownerType: string,
    ownerName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
      return this.searchOwner(ownerType, ownerName);
    });
  }

  public async getNamespace(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
      return this.searchNamespace(
        ownerType,
        ownerName,
        namespaceType,
        namespaceName,
      );
    });
  }

  public async getTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
      return this.searchTree(
        ownerType,
        ownerName,
        namespaceType,
        namespaceName,
        treeType,
        treeName,
      );
    });
  }

  public async getANodeOfTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
    nodeType: string,
    nodeName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
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
      return treeNode;
    });
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
    const tree: ObjectNode = await ctx.treeContext.treeNode.getOrSetValue(
      async () => {
        return this.searchTree(
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

    return concat(tree, await this.searchByParentTreeId(<string>tree.id));
  }

  public async getTreeNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.nodeContext.tree.getOrSetValue(async () => {
      return this.searchById(objectNode.parentTreeId);
    });
  }

  public searchById(
    id: string,
    filter?: FilterExcludingWhere<ObjectNode>,
    options?: Options,
  ): Promise<ObjectNode & ObjectNodeRelations> {
    return this.objectNodeRepository.findById(id, filter, options);
  }

  protected async checkNameAvailability(
    objectNode: DataObject<ObjectNode>,
    name: string,
    generate = false,
  ): Promise<void> {
    const authorizedChars = `A-Z|a-z|0-9|:$\\.\\-_`;
    const regexpName = new RegExp('^[' + authorizedChars + ']+$', 'g');
    if (!name) {
      throw ApplicationError.format('alphanumeric or - or _ or . or $', {
        name: name,
      });
    }
    if (!name.match(regexpName)) {
      if (generate) {
        name = toKebabCase(
          name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        );
        name = name
          .replace(new RegExp('[^' + authorizedChars + ']', 'g'), '_')
          .replace(/__+/g, '_');
      }
      if (!name.match(regexpName)) {
        throw ApplicationError.format('alphanumeric or - or _ or . or $', {
          name: name,
        });
      }
      objectNode.name = name;
    }
    const types = await this.objectTypeService.getImplementingCommonTypes(
      objectNode.objectTypeId as string,
    );
    if (!isArray(types)) {
      throw ApplicationError.notFound({type: objectNode.objectTypeId});
    }
    const otherNodes: ObjectNode[] = await this.findOrderedNodes({
      where: {
        parentTreeId: objectNode.parentTreeId,
        objectTypeId: {inq: types},
        name: name,
      },
    });
    if (otherNodes && 0 < otherNodes.length) {
      return this.resolveConflictName(objectNode, name, generate);
    }
    if (objectNode.tree) {
      const otherTrees: ObjectNode[] = await this.findOrderedNodes({
        where: {
          parentNamespaceId: objectNode.parentNamespaceId,
          objectTypeId: {inq: types},
          name: name,
          tree: true,
        },
      });
      if (otherTrees && 0 < otherTrees.length) {
        return this.resolveConflictName(objectNode, name, generate);
      }
    }
    if (objectNode.namespace) {
      const otherNamespaces: ObjectNode[] = await this.findOrderedNodes({
        where: {
          parentOwnerId: objectNode.parentOwnerId,
          objectTypeId: {inq: types},
          name: name,
          namespace: true,
        },
      });
      if (otherNamespaces && 0 < otherNamespaces.length) {
        return this.resolveConflictName(objectNode, name, generate);
      }
    }
    if (objectNode.owner) {
      const otherOwners: ObjectNode[] = await this.findOrderedNodes({
        where: {
          objectTypeId: {inq: types},
          name: name,
          owner: true,
        },
      });
      if (otherOwners && 0 < otherOwners.length) {
        return this.resolveConflictName(objectNode, name, generate);
      }
    }
  }
  private async resolveConflictName(
    objectNode: DataObject<ObjectNode>,
    name: string,
    generate = false,
  ): Promise<void> {
    if (!generate) {
      throw ApplicationError.conflict({name: name});
    }
    const nameParts = name.split('_');
    if (
      1 < nameParts.length &&
      Number.isInteger(Number.parseInt(nameParts[nameParts.length - 1]))
    ) {
      nameParts[nameParts.length - 1] =
        '' + (Number.parseInt(nameParts[nameParts.length - 1]) + 1);
      objectNode.name = nameParts.join('_');
    } else {
      objectNode.name = name + '_2';
    }
    return this.checkNameAvailability(objectNode, objectNode.name, generate);
  }

  public async checkBrothersCondition(
    parentNodeId: string,
    nodeContext: NodeContext,
  ): Promise<void> {
    const objectSubType: ObjectSubType = nodeContext.objectSubType.value;
    const brothers = await nodeContext.brothers.getOrSetValue(async () =>
      this.searchByParentNodeId(parentNodeId),
    );
    if (objectSubType.mandatories) {
      for (const brotherTypeId of objectSubType.mandatories) {
        if (
          !some(
            brothers,
            (brother: ObjectNode) => brother.objectTypeId === brotherTypeId,
          )
        ) {
          throw ApplicationError.missing({objectType: brotherTypeId});
        }
      }
    }
    if (objectSubType.exclusions) {
      for (const brotherTypeId of objectSubType.exclusions) {
        if (
          some(
            brothers,
            (brother: ObjectNode) => brother.objectTypeId === brotherTypeId,
          )
        ) {
          throw ApplicationError.incompatible({objectType: brotherTypeId});
        }
      }
    }

    if (
      Number.isInteger(objectSubType.max) &&
      brothers.filter(
        (brother) => brother.objectTypeId === objectSubType.subObjectTypeId,
      ).length >= (objectSubType.max as number)
    ) {
      throw ApplicationError.tooMany({
        objectType: objectSubType.subObjectTypeId,
      });
    }
  }

  private async checkSubTypesCondition(
    objectNode: ObjectNode,
    nodeContext: NodeContext,
    ctx: CurrentContext,
  ) {
    const objectType = nodeContext.objectType.value;
    if (objectType?.objectSubTypes) {
      for (const objectSubType of objectType.objectSubTypes) {
        if (objectSubType.min && 0 < objectSubType.min) {
          for (let i = 0; i < objectSubType.min; i++) {
            try {
              await this.add(
                {
                  title: objectSubType.title
                    ? objectSubType.title
                    : objectSubType.name,
                  objectTypeId: objectSubType.subObjectTypeId,
                  parentNodeId: objectNode.id,
                },
                CurrentContext.get(ctx, {
                  nodeContext: {
                    parentType: new ExpectedValue(objectType),
                    parent: new ExpectedValue<ObjectNode>(objectNode),
                    objectSubType: new ExpectedValue(objectSubType),
                  },
                }),
                false,
                true,
                true,
              );
            } catch (error) {
              console.trace(error);
            }
          }
        }
      }
    }
  }

  public async add(
    objectNode: DataObject<ObjectNode>,
    ctx: CurrentContext,
    byPassCheck = false,
    autoGenerateChildren = true,
    resolveNameConflict = false,
  ): Promise<ObjectNode> {
    const nodeContext = ctx.nodeContext;
    //let objectNode = clone(objectNodePosted);
    let objectNodeForUpdate = objectNode;
    let objectType: ObjectType = (null as unknown) as ObjectType;
    if (!objectNode.name && !objectNode.title && objectNode.objectTypeId) {
      objectType = await nodeContext.objectType.getOrSetValue(async () => {
        return this.objectTypeService.searchById(
          objectNode.objectTypeId as string,
        );
      });
      if (objectType?.title) {
        objectNode.title = objectType.title;
      }
    }
    if (!objectNode.name && objectNode.title) {
      objectNode.name = toKebabCase(objectNode.title);
    }
    if (!objectNode.title && objectNode.name) {
      objectNode.title = toStartCase(objectNode.name);
    }
    if (!byPassCheck) {
      if (!objectNode.name) {
        throw ApplicationError.missingParameter('name');
      }
      if (!objectNode.objectTypeId) {
        throw ApplicationError.missingParameter('objectTypeId');
      }
      if (!objectNode.parentNodeId) {
        throw ApplicationError.missingParameter('parentNodeId');
      }

      const parent: ObjectNode = await nodeContext.parent.getOrSetValue(
        async () => {
          return this.searchById(objectNode.parentNodeId as string);
        },
      );
      if (!parent) {
        throw ApplicationError.notFound({parent: objectNode.parentNodeId});
      }
      const parentType = await nodeContext.parentType.getOrSetValue(
        async () => {
          return this.objectTypeService.searchById(parent.objectTypeId);
        },
      );
      if (!parentType) {
        throw ApplicationError.corruptedData({
          parent: objectNode.parentNodeId,
          parentType: parent.objectTypeId,
        });
      }
      const objectSubType: ObjectSubType = await nodeContext.objectSubType.getOrSetValue(
        async () => {
          return find(parentType.objectSubTypes, (subType) => {
            return subType.subObjectTypeId === objectNode.objectTypeId;
          }) as ObjectSubType;
        },
      );
      if (!objectSubType) {
        throw ApplicationError.unauthorizedValue({
          objectType: objectNode.objectTypeId,
        });
      }
      await this.checkBrothersCondition(objectNode.parentNodeId, nodeContext);

      objectType = await nodeContext.objectType.getOrSetValue(async () => {
        return this.objectTypeService.searchById(
          objectNode.objectTypeId as string,
        );
      });
      if (!objectType) {
        throw ApplicationError.notFound({objectType: objectNode.objectTypeId});
      }

      objectNode.parentACLId =
        !parent.acl && parent.parentACLId ? parent.parentACLId : parent.id;
      objectNode.aclList = !parent.aclList
        ? [parent.id]
        : objectNode.parentACLId === parent.id
        ? concat(parent.aclList, [objectNode.parentACLId])
        : parent.aclList;

      objectNode.parentOwnerId =
        !parent.owner && parent.parentOwnerId
          ? parent.parentOwnerId
          : parent.id;

      objectNode.parentTreeId =
        !parent.tree && parent.parentTreeId ? parent.parentTreeId : parent.id;

      objectNode.parentNamespaceId =
        !parent.namespace && parent.parentNamespaceId
          ? parent.parentNamespaceId
          : parent.id;

      objectNode.owner = objectSubType.owner;
      objectNode.acl = !!objectNode.owner || !!objectSubType.acl;
      objectNode.namespace = !!objectNode.owner || !!objectSubType.namespace;
      objectNode.tree = !!objectNode.namespace || !!objectSubType.tree;

      await this.checkNameAvailability(
        objectNode,
        <string>objectNode.name,
        resolveNameConflict,
      );

      objectNodeForUpdate = pick(
        objectNode,
        this.getPropertiesKeys(objectType, [
          'name',
          'title',
          'objectTypeId',
          'parentNodeId',
          'parentACLId',
          'aclList',
          'parentOwnerId',
          'parentTreeId',
          'parentNamespaceId',
          'owner',
          'acl',
          'namespace',
          'tree',
        ]),
      );
    }
    const brothers = await nodeContext.brothers.getOrSetValue(async () =>
      this.searchByParentNodeId(objectNode.parentNodeId as string),
    );
    objectNodeForUpdate.index = 10;
    for (const brother of brothers) {
      if (brother.index && brother.index + 10 > objectNodeForUpdate.index) {
        objectNodeForUpdate.index = brother.index + 10;
      }
    }
    const result = await this.objectNodeRepository.create(objectNodeForUpdate);

    const changes = await this.contentEntityService.manageContent(
      objectType?.contentType,
      result,
      objectNode as Entity,
    );
    if (changes) {
      await this.objectNodeRepository.updateById(result.id, result);
    }

    if (autoGenerateChildren) {
      await this.checkSubTypesCondition(result, nodeContext, ctx);
    }

    return result;
  }

  protected getPropertiesKeys(
    objectType: ObjectType,
    objectKeys = ['name', 'title'],
  ): string[] {
    let finalObjectKeys = objectKeys;
    if (objectType.definition?.properties) {
      finalObjectKeys = objectKeys.concat(
        Object.keys(objectType.definition.properties),
      );
    }
    return finalObjectKeys;
  }

  async modifyById(
    id: string,
    objectNode: DataObject<ObjectNode>,
    ctx: CurrentContext,
    byPassCheck = false,
  ): Promise<ObjectNode> {
    let objectNodeForUpdate = objectNode;
    if (!byPassCheck) {
      const node = await this.getNode(id, ctx);
      if (!node) {
        throw ApplicationError.notFound({object: id});
      }
      if ('name' in objectNode && node.name !== objectNode.name) {
        if (!objectNode.name) {
          throw ApplicationError.missingParameter('name');
        }
        await this.checkNameAvailability(node, <string>objectNode.name);
      }
      const objectType = await this.objectTypeService.searchById(
        node.objectTypeId,
      );
      if (!objectType) {
        throw ApplicationError.corruptedData({
          object: id,
          objectType: node.objectTypeId,
        });
      }
      objectNodeForUpdate = pick(
        objectNode,
        this.getPropertiesKeys(objectType),
      );
    }

    await this.objectNodeRepository.updateById(id, objectNodeForUpdate);

    const result = await this.objectNodeRepository.findById(id);

    const changes = await this.contentEntityService.manageContent(
      (await this.objectTypeService.searchById(result.objectTypeId))
        .contentType,
      result,
      objectNode as Entity,
    );
    if (changes) {
      await this.objectNodeRepository.updateById(result.id, result);
    }

    return result;
  }

  protected getParentIdKey(parentType: ParentNodeType) {
    return (
      'parent' +
      parentType.charAt(0).toUpperCase() +
      parentType.substr(1) +
      'Id'
    );
  }

  async deleteContentNodes(where: Where, ctx: CurrentContext) {
    const contentTypes = await this.objectTypeService.getTypeWithContent(ctx);
    if (0 < Object.keys(contentTypes).length) {
      const deletedContentObjects = await this.findOrderedNodes({
        where: merge(where, {
          objectTypeId: {inq: Object.keys(contentTypes)},
        }),
      });
      if (0 < deletedContentObjects.length) {
        for (const contentType of this.contentEntityService.contentTypes) {
          const deletedObjects = deletedContentObjects.filter(
            (deletedObject) => {
              return (
                contentType ===
                contentTypes[deletedObject.objectTypeId].contentType
              );
            },
          );
          if (0 < deletedObjects.length) {
            await this.contentEntityService.deleteContents(
              contentType,
              deletedObjects,
            );
          }
        }
      }
    }
  }

  async removeByParent(
    parentType: ParentNodeType,
    id: string,
    ctx: CurrentContext,
  ): Promise<void> {
    const parentIdKey = this.getParentIdKey(parentType);
    const whereClause = merge(
      {
        [parentIdKey]: id,
      },
      'node' === parentType ? {} : {[parentType]: true},
    );
    const subChildrenNodes = await this.findOrderedNodes({
      where: whereClause,
    });
    for (const subChildNode of subChildrenNodes) {
      await this.removeByParent(parentType, <string>subChildNode.id, ctx);
    }

    await this.deleteContentNodes(
      {
        [parentIdKey]: id,
      },
      ctx,
    );

    await this.objectNodeRepository.deleteAll({
      [parentIdKey]: id,
    });
  }

  async removeById(id: string, ctx: CurrentContext): Promise<void> {
    const node = await this.getNode(id, ctx);
    if (!node) {
      throw ApplicationError.notFound({object: id});
    }

    if (node.owner) {
      await this.removeByParent(ParentNodeType.owner, <string>node.id, ctx);
    } else if (node.namespace) {
      await this.removeByParent(ParentNodeType.namespace, <string>node.id, ctx);
    } else if (node.tree) {
      await this.removeByParent(ParentNodeType.tree, <string>node.id, ctx);
    } else {
      await this.removeByParent(ParentNodeType.node, <string>node.id, ctx);
    }

    await this.deleteContentNodes(
      {
        id: id,
      },
      ctx,
    );

    await this.objectNodeRepository.deleteById(id);
    return;
  }

  public async moveTo(child: ObjectNode, parent: ObjectNode) {
    const newTreeId: string = (parent.tree
      ? parent.id
      : parent.parentTreeId) as string;
    const newNamespaceId: string = (parent.namespace
      ? parent.id
      : parent.parentNamespaceId) as string;
    const newACLId: string = (parent.acl
      ? parent.id
      : parent.parentACLId) as string;
    const newOwnerId: string = (parent.owner
      ? parent.id
      : parent.parentOwnerId) as string;

    if (child.parentNamespaceId !== newNamespaceId) {
      // can't move from namespace to another
      throw ApplicationError.notImplemented({
        method: 'moveTo',
        context: 'change namespace',
      });
    }

    if (child.parentOwnerId !== newOwnerId) {
      // can't move from owner to another
      throw ApplicationError.notImplemented({
        method: 'moveTo',
        context: 'change owner',
      });
    }

    if (child.parentACLId !== newACLId) {
      // can't move from ACL to another
      throw ApplicationError.notImplemented({
        method: 'moveTo',
        context: 'change ACL',
      });
    }
    if (child.parentTreeId !== newTreeId) {
      const children: ObjectNode[] = await this.loadChildrenNodes(child);
      for (const node of children) {
        node.parentACLId = newACLId;
        node.parentNamespaceId = newNamespaceId;
        node.parentTreeId = newTreeId;
        node.parentOwnerId = newOwnerId;
        await this.checkNameAvailability(node, node.name, true);
        const objectNodeForUpdate: DataObject<ObjectNode> = {
          name: node.name,
          parentACLId: newACLId,
          parentOwnerId: newOwnerId,
          parentNamespaceId: newNamespaceId,
          parentTreeId: newTreeId,
        };
        if (node.id === child.id) {
          objectNodeForUpdate.parentNodeId = parent.id as string;
        }
        await this.objectNodeRepository.updateById(
          node.id,
          objectNodeForUpdate,
        );
      }
      return;
    }

    await this.objectNodeRepository.updateById(child.id, {
      parentNodeId: parent.id as string,
      parentACLId: newACLId,
      parentOwnerId: newOwnerId,
      parentNamespaceId: newNamespaceId,
      parentTreeId: newTreeId,
    });
  }

  public async loadChildrenNodes(
    rootTreeNode: ObjectNode,
  ): Promise<ObjectNode[]> {
    let children: ObjectNode[];
    if (rootTreeNode.tree) {
      children = await this.searchByParentTreeId(rootTreeNode.id as string);
    } else {
      const candidateChildren: ObjectNode[] = await this.searchByParentTreeId(
        rootTreeNode.parentTreeId,
      );
      children = this.selectChildrenFromCandidatesList(
        rootTreeNode,
        candidateChildren,
      );
    }

    return concat(rootTreeNode, children);
  }
  private selectChildrenFromCandidatesList(
    parent: ObjectNode,
    candidates: ObjectNode[],
    children: ObjectNode[] = [],
  ): ObjectNode[] {
    for (const child of candidates) {
      if (child.parentNodeId === parent.id) {
        children.push(child);
        this.selectChildrenFromCandidatesList(child, candidates, children);
      }
    }
    return children;
  }
}
