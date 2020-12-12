import {service} from '@loopback/core';
import {
  DataObject,
  Entity,
  FilterExcludingWhere,
  Options,
  repository,
  Where,
} from '@loopback/repository';
import {concat, find, merge, pick, some} from 'lodash';
import {ApplicationError} from '../../helper/application-error';
import {ObjectNode} from '../../models';
import {ObjectNodeRelations} from '../../models/object-node.model';
import {ObjectSubType} from '../../models/object-sub-type.model';
import {ObjectType} from '../../models/object-type.model';
import {ObjectNodeRepository} from '../../repositories';
import {CurrentContext, ExpectedValue} from '../application.service';
import {ContentEntityService} from '../content-entity/content-entity.service';
import {ObjectTypeService} from '../object-type.service';
import {NodeContext} from './../application.service';

export enum ParentNodeType {
  node = 'node',
  tree = 'tree',
  owner = 'owner',
  namespace = 'namespace',
}

export class ObjectNodeService {
  constructor(
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {}

  public searchByTreeId(treeId: string): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentTreeId: treeId},
    });
  }

  public searchByTreeIds(treeIds: string[]): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentTreeId: {inq: treeIds}},
    });
  }

  public searchByParentId(
    parentNodeId: string,
    objectTypeId?: string,
    objectName?: string,
  ): Promise<ObjectNode[]> {
    const where: Where<ObjectNode> = {parentNodeId};
    if (objectTypeId) {
      where.objectTypeId = objectTypeId;
    }
    if (objectName) {
      where.name = objectName;
    }
    return this.objectNodeRepository.find({
      where: where,
    });
  }

  public searchByParentIdAndObjectTypeId(
    parentNodeId: string,
    objectTypeId: string,
    objectName?: string,
  ): Promise<ObjectNode[]> {
    return this.searchByParentId(parentNodeId, objectTypeId, objectName);
  }

  public searchByParentIdsAndObjectTypeId(
    parentNodeIds: string[],
    objectTypeId: string,
  ): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentNodeId: {inq: parentNodeIds}, objectTypeId},
    });
  }

  public async searchOwner(
    ownerType: string,
    ownerName: string,
  ): Promise<ObjectNode> {
    const nodes = await this.objectNodeRepository.find({
      where: {objectTypeId: ownerType, name: ownerName, owner: true},
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
      throw ApplicationError.notFound({owner: ownerType, ownerNale: ownerName});
    }
    return this.searchNamespaceOfOwnerId(
      owner.id as string,
      namespaceType,
      namespaceName,
      {
        owner: ownerType,
        ownerName: ownerName,
      },
    );
  }

  public async searchNamespaceOfOwnerId(
    ownerId: string,
    namespaceType: string,
    namespaceName: string,
    errorContext = {},
  ): Promise<ObjectNode> {
    const nodes = await this.objectNodeRepository.find({
      where: {
        objectTypeId: namespaceType,
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

  public async getOrCreateChildren(
    parentId: string,
    objectTypeId: string,
    defaultValue?: DataObject<ObjectNode>,
    min = 1,
  ): Promise<ObjectNode[]> {
    const children = await this.searchByParentIdAndObjectTypeId(
      parentId,
      objectTypeId,
    );
    if (defaultValue && children.length < min) {
      while (children.length < min) {
        children.push(
          await this.add(
            merge({}, defaultValue, {
              parentNodeId: parentId,
              objectTypeId: objectTypeId,
            }),
            new CurrentContext(),
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
    return this.objectNodeRepository.find({
      where: {
        objectTypeId: treeType,
        parentNamespaceId: namespaceId,
        tree: true,
      },
    });
  }

  public async searchTreeNode(
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

    const nodes = await this.objectNodeRepository.find({
      where: {
        objectTypeId: treeType,
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
    return 1 === nodes.length ? nodes[0] : <ObjectNode>(<unknown>null);
  }

  public async getNode(id: string, ctx: CurrentContext): Promise<ObjectNode> {
    return ctx.nodeContext.node.getOrSetValue(async () => {
      return this.searchById(id);
    });
  }

  public searchById(
    id: string,
    filter?: FilterExcludingWhere<ObjectNode>,
    options?: Options,
  ): Promise<ObjectNode & ObjectNodeRelations> {
    return this.objectNodeRepository.findById(id, filter, options);
  }

  protected async checkNameAvailibility(
    objectNode: DataObject<ObjectNode>,
    name: string,
  ) {
    if (!objectNode.owner && !objectNode.namespace && !objectNode.tree) {
      return;
    }
    if (objectNode.tree) {
      const otherTrees: ObjectNode[] = await this.objectNodeRepository.find({
        where: {
          parentNamespaceId: objectNode.parentNamespaceId,
          objectTypeId: objectNode.objectTypeId,
          name: name,
          tree: true,
        },
      });
      if (otherTrees && 0 < otherTrees.length) {
        throw ApplicationError.conflict({name: name});
      }
    }
    if (objectNode.namespace) {
      const otherNamespaces: ObjectNode[] = await this.objectNodeRepository.find(
        {
          where: {
            parentOwnerId: objectNode.parentOwnerId,
            objectTypeId: objectNode.objectTypeId,
            name: name,
            namespace: true,
          },
        },
      );
      if (otherNamespaces && 0 < otherNamespaces.length) {
        throw ApplicationError.conflict({name: name});
      }
    }
    if (objectNode.owner) {
      const otherOwners: ObjectNode[] = await this.objectNodeRepository.find({
        where: {
          objectTypeId: objectNode.objectTypeId,
          name: name,
          owner: true,
        },
      });
      if (otherOwners && 0 < otherOwners.length) {
        throw ApplicationError.conflict({name: name});
      }
    }
  }

  public async checkBrothersCondition(
    parentNodeId: string,
    nodeContext: NodeContext,
  ): Promise<void> {
    const objectSubType: ObjectSubType = nodeContext.objectSubType.value;
    const brothers = await nodeContext.brothers.getOrSetValue(async () =>
      this.searchByParentId(parentNodeId),
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
      objectSubType.max &&
      brothers.filter(
        (brother) => brother.objectTypeId === objectSubType.subObjectTypeId,
      ).length >= objectSubType.max
    ) {
      throw ApplicationError.tooMany({
        objectType: objectSubType.subObjectTypeId,
      });
    }
  }

  private async checkSubTypesCondition(
    objectNode: ObjectNode,
    nodeContext: NodeContext,
  ) {
    const objectType = nodeContext.objectType.value;
    if (objectType?.objectSubTypes) {
      for (const objectSubType of objectType.objectSubTypes) {
        if (objectSubType.min && 0 < objectSubType.min) {
          for (let i = 0; i < objectSubType.min; i++) {
            try {
              await this.add(
                {
                  name: objectSubType.name,
                  objectTypeId: objectSubType.subObjectTypeId,
                  parentNodeId: objectNode.id,
                },
                CurrentContext.get({
                  nodeContext: {
                    parentType: new ExpectedValue(objectType),
                    parent: new ExpectedValue<ObjectNode>(objectNode),
                    objectSubType: new ExpectedValue(objectSubType),
                  },
                }),
              );
            } catch (error) {
              console.log(error);
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
  ): Promise<ObjectNode> {
    const nodeContext = ctx.nodeContext;
    //let objectNode = clone(objectNodePosted);
    let objectNodeForUpdate = objectNode;
    let objectType: ObjectType = (null as unknown) as ObjectType;
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

      await this.checkNameAvailibility(objectNode, <string>objectNode.name);

      objectNodeForUpdate = pick(
        objectNode,
        this.getPropertiesKeys(objectType, [
          'name',
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
      await this.checkSubTypesCondition(result, nodeContext);
    }

    /*
    await this.contentEntityService.addTransientContent(
      objectType?.contentType,
      result,
    );*/

    return result;
  }

  protected getPropertiesKeys(
    objectType: ObjectType,
    objectKeys = ['name'],
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
  ): Promise<ObjectNode> {
    const node = await this.getNode(id, ctx);
    if (!node) {
      throw ApplicationError.notFound({object: id});
    }
    if ('name' in objectNode && node.name !== objectNode.name) {
      if (!objectNode.name) {
        throw ApplicationError.missingParameter('name');
      }
      await this.checkNameAvailibility(node, <string>objectNode.name);
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

    await this.objectNodeRepository.updateById(
      id,
      pick(objectNode, this.getPropertiesKeys(objectType)),
    );

    const result = await this.objectNodeRepository.findById(id);

    const changes = await this.contentEntityService.manageContent(
      objectType?.contentType,
      result,
      objectNode as Entity,
    );
    if (changes) {
      await this.objectNodeRepository.updateById(result.id, result);
    }

    /*
    await this.contentEntityService.addTransientContent(
      objectType?.contentType,
      result,
    );*/

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
      const deletedContentObjects = await this.objectNodeRepository.find({
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
    const subChildsNodes = await this.objectNodeRepository.find({
      where: whereClause,
    });
    for (const subChildNode of subChildsNodes) {
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
}
