import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {
  DataObject,
  Entity,
  FilterExcludingWhere,
  Options,
  repository,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import _ from 'lodash';
import {ObjectNode} from '../models';
import {ObjectNodeRepository} from '../repositories';
import {ObjectNodeRelations} from './../models/object-node.model';
import {ObjectType} from './../models/object-type.model';
import {CurrentContext, NodeContext} from './application.service';
import {ContentEntityService} from './content-entity.service';
import {ObjectTypeService} from './object-type.service';

export enum ParentNodeType {
  node = 'node',
  tree = 'tree',
  owner = 'owner',
  namespace = 'namespace',
}

@bind({scope: BindingScope.SINGLETON})
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

  public searchByParentIdAndObjectTypeId(
    parentNodeId: string,
    objectTypeId: string,
  ): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentNodeId, objectTypeId},
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
      throw new HttpErrors.PreconditionFailed('bad owner type.');
    }
    const nodes = await this.objectNodeRepository.find({
      where: {objectTypeId: ownerObjectType.id, name: ownerName, owner: true},
    });
    if (1 < nodes.length) {
      throw new HttpErrors.PreconditionFailed(
        'Too many ' + ownerType + ' ' + ownerName,
      );
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
      throw new HttpErrors.PreconditionFailed(
        'no owner ' + ownerType + ' ' + ownerName,
      );
    }
    const namespaceObjectType = await this.objectTypeService.searchByName(
      namespaceType,
    );
    if (!namespaceObjectType) {
      throw new HttpErrors.PreconditionFailed(
        'bad namespace type ' + namespaceType,
      );
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
      throw new HttpErrors.ExpectationFailed(
        'Too many ' +
          namespaceType +
          ' ' +
          namespaceName +
          ' own by ' +
          ownerType +
          ' ' +
          ownerName,
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

  public async searchTreeNodes(
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
      throw new HttpErrors.PreconditionFailed(
        'no namespace ' + namespaceType + ' ' + namespaceName,
      );
    }
    const treeObjectType = await this.objectTypeService.searchByName(treeType);
    if (!treeObjectType) {
      throw new HttpErrors.PreconditionFailed('bad tree type ' + namespaceType);
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
      throw new HttpErrors.ExpectationFailed(
        'Too many ' +
          namespaceType +
          ' ' +
          namespaceName +
          ' own by ' +
          ownerType +
          ' ' +
          ownerName,
      );
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
        throw new HttpErrors.Conflict('Duplicate name ' + name);
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
        throw new HttpErrors.Conflict('Duplicate name ' + name);
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
        throw new HttpErrors.Conflict('Duplicate name ' + name);
      }
    }
  }

  private async checkBrothersCondition(
    objectNode: DataObject<ObjectNode>,
    nodeContext: NodeContext,
  ): Promise<void> {
    if (nodeContext.objectSubType?.mandatories) {
      for (const brotherTypeId of nodeContext.objectSubType.mandatories) {
        if (
          0 ===
          (
            await this.searchByParentIdAndObjectTypeId(
              objectNode.parentNodeId as string,
              brotherTypeId,
            )
          ).length
        ) {
          throw new HttpErrors.PreconditionRequired(
            'Need a brother node of type ' + brotherTypeId,
          );
        }
      }
    }
    if (nodeContext.objectSubType?.exclusions) {
      for (const brotherTypeId of nodeContext.objectSubType.exclusions) {
        if (
          0 <
          (
            await this.searchByParentIdAndObjectTypeId(
              objectNode.parentNodeId as string,
              brotherTypeId,
            )
          ).length
        ) {
          throw new HttpErrors.PreconditionFailed(
            'Incompatible with a brother node of type ' + brotherTypeId,
          );
        }
      }
    }
    if (
      nodeContext.objectSubType?.max &&
      (
        await this.searchByParentIdAndObjectTypeId(
          objectNode.parentNodeId as string,
          objectNode.objectTypeId as string,
        )
      ).length >= nodeContext.objectSubType.max
    ) {
      throw new HttpErrors.PreconditionFailed(
        'Too many node of type ' + objectNode.objectTypeId,
      );
    }
  }

  private async checkSubTypesCondition(
    objectNode: ObjectNode,
    nodeContext: NodeContext,
  ) {
    if (nodeContext.objectType?.objectSubTypes) {
      for (const objectSubType of nodeContext.objectType.objectSubTypes) {
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
                    parentType: nodeContext.objectType,
                    parent: objectNode,
                    objectSubType: objectSubType,
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
    if (!byPassCheck) {
      if (!objectNode.name) {
        throw new HttpErrors.PreconditionFailed('name mandatory');
      }
      if (!objectNode.objectTypeId) {
        throw new HttpErrors.PreconditionFailed('objectTypeId mandatory');
      }
      if (!objectNode.parentNodeId) {
        throw new HttpErrors.PreconditionFailed('parentNodeId mandatory');
      }

      nodeContext.parent = nodeContext.parent
        ? nodeContext.parent
        : await this.searchById(objectNode.parentNodeId);
      if (!nodeContext.parent) {
        throw new HttpErrors.PreconditionFailed('unknown parent');
      }
      nodeContext.parentType = nodeContext.parentType
        ? nodeContext.parentType
        : await this.objectTypeService.searchById(
            nodeContext.parent.objectTypeId,
          );
      if (!nodeContext.parentType) {
        throw new HttpErrors.PreconditionFailed('unknown parentType');
      }
      nodeContext.objectSubType = nodeContext.objectSubType
        ? nodeContext.objectSubType
        : _.find(nodeContext.parentType.objectSubTypes, (subType) => {
            return subType.subObjectTypeId === objectNode.objectTypeId;
          });
      if (!nodeContext.objectSubType) {
        throw new HttpErrors.PreconditionFailed('Not authorized objectType');
      }
      await this.checkBrothersCondition(objectNode, nodeContext);

      nodeContext.objectType = await this.objectTypeService.searchById(
        objectNode.objectTypeId,
      );
      if (!nodeContext.objectType) {
        throw new HttpErrors.PreconditionFailed('Unknown objectType');
      }

      objectNode.parentACLId =
        !nodeContext.parent.acl && nodeContext.parent.parentACLId
          ? nodeContext.parent.parentACLId
          : nodeContext.parent.id;
      objectNode.aclList = !nodeContext.parent.aclList
        ? [nodeContext.parent.id]
        : objectNode.parentACLId === nodeContext.parent.id
        ? _.concat(nodeContext.parent.aclList, [objectNode.parentACLId])
        : nodeContext.parent.aclList;

      objectNode.parentOwnerId =
        !nodeContext.parent.owner && nodeContext.parent.parentOwnerId
          ? nodeContext.parent.parentOwnerId
          : nodeContext.parent.id;

      objectNode.parentTreeId =
        !nodeContext.parent.tree && nodeContext.parent.parentTreeId
          ? nodeContext.parent.parentTreeId
          : nodeContext.parent.id;

      objectNode.parentNamespaceId =
        !nodeContext.parent.namespace && nodeContext.parent.parentNamespaceId
          ? nodeContext.parent.parentNamespaceId
          : nodeContext.parent.id;

      objectNode.owner = nodeContext.objectSubType.owner;
      objectNode.acl = !!objectNode.owner || !!nodeContext.objectSubType.acl;
      objectNode.namespace =
        !!objectNode.owner || !!nodeContext.objectSubType.namespace;
      objectNode.tree =
        !!objectNode.namespace || !!nodeContext.objectSubType.tree;

      await this.checkNameAvailibility(objectNode, <string>objectNode.name);

      objectNodeForUpdate = _.pick(
        objectNode,
        this.getPropertiesKeys(nodeContext.objectType, [
          'name',
          'objectTypeId',
          'parentNodeId',
          'parentACLId',
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
      nodeContext.objectType?.contentType,
      result,
      objectNode as Entity,
    );
    if (changes) {
      await this.objectNodeRepository.updateById(result.id, result);
    }

    await this.checkSubTypesCondition(result, nodeContext);

    await this.contentEntityService.addTransientContent(
      nodeContext.objectType?.contentType,
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
      throw new HttpErrors.NotFound('Unknwon object ' + id);
    }
    if ('name' in objectNode && node.name !== objectNode.name) {
      if (!objectNode.name) {
        throw new HttpErrors.PreconditionFailed('name mandatory');
      }
      await this.checkNameAvailibility(node, <string>objectNode.name);
    }
    const objectType = await this.objectTypeService.searchById(
      node.objectTypeId,
    );
    if (!objectType) {
      throw new HttpErrors.ExpectationFailed(
        'Unknwon object type ' + node.objectTypeId,
      );
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
  /*
   * Add service methods here
   */

  public updateById(
    id: string,
    objectNode: DataObject<ObjectNode>,
  ): Promise<void> {
    throw new HttpErrors.NotImplemented('Method not implemented.');
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
      throw new HttpErrors.NotFound('Unknwon node ' + id);
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
