import {service} from '@loopback/core';
import {
  DataObject,
  Entity,
  FilterExcludingWhere,
  Options,
  repository,
} from '@loopback/repository';
import _ from 'lodash';
import {ObjectNode} from '../models';
import {ObjectNodeRepository} from '../repositories';
import {ApplicationError} from './../helper/application-error';
import {ObjectNodeRelations} from './../models/object-node.model';
import {ObjectSubType} from './../models/object-sub-type.model';
import {ObjectType} from './../models/object-type.model';
import {
  CurrentContext,
  ExpectedValue,
  NodeContext,
} from './application.service';
import {ContentEntityService} from './content-entity.service';
import {ObjectTypeService} from './object-type.service';

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

  public searchByParentIdAndObjectTypeId(
    parentNodeId: string,
    objectTypeId: string,
  ): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentNodeId, objectTypeId},
    });
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
    const ownerObjectType = await this.objectTypeService.searchByName(
      ownerType,
    );
    if (!ownerObjectType) {
      throw ApplicationError.notFound({ownerType});
    }
    const nodes = await this.objectNodeRepository.find({
      where: {objectTypeId: ownerObjectType.id, name: ownerName, owner: true},
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
    const namespaceObjectType = await this.objectTypeService.searchByName(
      namespaceType,
    );
    if (!namespaceObjectType) {
      throw ApplicationError.notFound({
        owner: ownerType,
        ownerName: ownerName,
        namespace: namespaceType,
        namespaceName: namespaceName,
      });
    }

    const nodes = await this.objectNodeRepository.find({
      where: {
        objectTypeId: namespaceObjectType.id,
        name: namespaceName,
        parentOwnerId: owner.id,
        namespace: true,
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
            _.merge({}, defaultValue, {
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
    const treeObjectType = await this.objectTypeService.searchByName(treeType);
    if (!treeObjectType) {
      throw ApplicationError.notFound({
        namespace: namespaceType,
        namespaceType,
        treeType,
      });
    }

    const nodes = await this.objectNodeRepository.find({
      where: {
        objectTypeId: treeObjectType.id,
        name: treeName,
        parentNamepaceId: namespace.id,
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

  private async checkBrothersCondition(
    objectNode: DataObject<ObjectNode>,
    nodeContext: NodeContext,
  ): Promise<void> {
    const objectSubType: ObjectSubType = nodeContext.objectSubType.value;
    if (objectSubType.mandatories) {
      for (const brotherTypeId of objectSubType.mandatories) {
        if (
          0 ===
          (
            await this.searchByParentIdAndObjectTypeId(
              objectNode.parentNodeId as string,
              brotherTypeId,
            )
          ).length
        ) {
          throw ApplicationError.missing({objectType: brotherTypeId});
        }
      }
    }
    if (objectSubType.exclusions) {
      for (const brotherTypeId of objectSubType.exclusions) {
        if (
          0 <
          (
            await this.searchByParentIdAndObjectTypeId(
              objectNode.parentNodeId as string,
              brotherTypeId,
            )
          ).length
        ) {
          throw ApplicationError.incompatible({objectType: brotherTypeId});
        }
      }
    }
    if (
      objectSubType.max &&
      (
        await this.searchByParentIdAndObjectTypeId(
          objectNode.parentNodeId as string,
          objectNode.objectTypeId as string,
        )
      ).length >= objectSubType.max
    ) {
      throw ApplicationError.tooMany({objectType: objectNode.objectTypeId});
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
  ): Promise<ObjectNode> {
    const nodeContext = ctx.nodeContext;
    //let objectNode = _.clone(objectNodePosted);
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
          return _.find(parentType.objectSubTypes, (subType) => {
            return subType.subObjectTypeId === objectNode.objectTypeId;
          }) as ObjectSubType;
        },
      );
      if (!objectSubType) {
        throw ApplicationError.unauthorizedValue({
          objectType: objectNode.objectTypeId,
        });
      }
      await this.checkBrothersCondition(objectNode, nodeContext);

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
        ? _.concat(parent.aclList, [objectNode.parentACLId])
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

      objectNodeForUpdate = _.pick(
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

    await this.checkSubTypesCondition(result, nodeContext);

    await this.contentEntityService.addTransientContent(
      objectType?.contentType,
      result,
    );

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
    const node = await this.objectNodeRepository.findById(id);
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
      _.pick(objectNode, this.getPropertiesKeys(objectType)),
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

    await this.contentEntityService.addTransientContent(
      objectType?.contentType,
      result,
    );

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

  async removeByParent(parentType: ParentNodeType, id: string): Promise<void> {
    const parentIdKey = this.getParentIdKey(parentType);
    const whereClause = _.merge(
      {
        [parentIdKey]: id,
      },
      'node' === parentType ? {} : {[parentType]: true},
    );
    const subChildsNodes = await this.objectNodeRepository.find({
      where: whereClause,
    });
    for (const subChildNode of subChildsNodes) {
      await this.removeByParent(parentType, <string>subChildNode.id);
    }

    await this.objectNodeRepository.deleteAll({
      [parentIdKey]: id,
    });
  }

  async removeById(id: string, ctx: CurrentContext): Promise<void> {
    const node = await this.objectNodeRepository.findById(id);
    if (!node) {
      throw ApplicationError.notFound({object: id});
    }

    if (node.owner) {
      await this.removeByParent(ParentNodeType.owner, <string>node.id);
    } else if (node.namespace) {
      await this.removeByParent(ParentNodeType.namespace, <string>node.id);
    } else if (node.tree) {
      await this.removeByParent(ParentNodeType.tree, <string>node.id);
    } else {
      await this.removeByParent(ParentNodeType.node, <string>node.id);
    }
    await this.objectNodeRepository.deleteById(id);
    return;
  }
}
