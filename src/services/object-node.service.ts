import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {
  AndClause,
  Condition,
  Count,
  DataObject,
  Filter,
  FilterExcludingWhere,
  Options,
  OrClause,
  repository,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import _ from 'lodash';
import {ObjectNode} from '../models';
import {ObjectNodeRepository} from '../repositories';
import {ObjectNodeRelations} from './../models/object-node.model';
import {ObjectSubType} from './../models/object-sub-type.model';
import {ObjectType} from './../models/object-type.model';
import {ObjectTypeService} from './object-type.service';

export enum ParentNodeType {
  node = 'node',
  tree = 'tree',
  owner = 'owner',
  namespace = 'namespace',
}

@bind({scope: BindingScope.TRANSIENT})
export class ObjectNodeService {
  findById(
    id: string,
    filter:
      | Pick<
          Filter<ObjectNode>,
          'fields' | 'order' | 'limit' | 'skip' | 'offset' | 'include'
        >
      | undefined,
  ): ObjectNode | PromiseLike<ObjectNode> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
  constructor(
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
  ) {}

  public searchByTreeId(treeId: string): Promise<ObjectNode[]> {
    return this.objectNodeRepository.find({
      where: {parentTreeId: treeId},
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
      throw new Error(
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
      throw new Error(
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
        throw new HttpErrors.PreconditionFailed('Duplicate name ' + name);
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
        throw new HttpErrors.PreconditionFailed('Duplicate name ' + name);
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
        throw new HttpErrors.PreconditionFailed('Duplicate name ' + name);
      }
    }
  }

  public async add(
    objectNode: DataObject<ObjectNode>,
    byPassCheck = false,
  ): Promise<ObjectNode> {
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
      if (objectNode.id) {
        delete objectNode.id;
      }

      const parent = await this.searchById(objectNode.parentNodeId);
      if (!parent) {
        throw new HttpErrors.PreconditionFailed('unknown parent');
      }
      const parentType = await this.objectTypeService.searchById(
        parent.objectTypeId,
      );
      if (!parentType) {
        throw new HttpErrors.PreconditionFailed('unknown parentType');
      }
      const objectSubType: ObjectSubType = <ObjectSubType>_.find(
        parentType.objectSubTypes,
        subType => {
          return subType.subObjectTypeId === objectNode.objectTypeId;
        },
      );
      if (!objectSubType) {
        throw new HttpErrors.PreconditionFailed('Not authorized objectType');
      }
      //TODO : check objectSubType.mandatories
      //TODO : check objectSubType.exclusions
      //TODO : check objectSubType.max

      const objectType: ObjectType = await this.objectTypeService.searchById(
        objectNode.objectTypeId,
      );
      if (!objectType) {
        throw new HttpErrors.PreconditionFailed('Unknown objectType');
      }
      //TODO : check objectType.objectSubTypes.min

      objectNode.parentACLId =
        !parent.acl && parent.parentACLId ? parent.parentACLId : parent.id;

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
      objectNode.acl = objectNode.owner ?? objectSubType.acl;
      objectNode.namespace = objectNode.owner ?? objectSubType.namespace;
      objectNode.tree = objectNode.namespace ?? objectSubType.tree;

      await this.checkNameAvailibility(objectNode, objectNode.name);
    }
    return this.objectNodeRepository.create(objectNode);
  }

  async modifyById(
    id: string,
    objectNode: DataObject<ObjectNode>,
    options?: Options,
  ): Promise<void> {
    const node = await this.objectNodeRepository.findById(id);
    if (!node) {
      throw new HttpErrors.NotFound('Unknwon node ' + id);
    }
    if ('name' in objectNode && node.name !== objectNode.name) {
      await this.checkNameAvailibility(node, <string>objectNode.name);
    }

    return this.objectNodeRepository.updateById(
      id,
      _.pick(objectNode, ['name']),
      options,
    );
  }
  /*
   * Add service methods here
   */

  public updateById(
    id: string,
    objectNode: DataObject<ObjectNode>,
  ): Promise<void> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
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

  async removeById(id: string): Promise<void> {
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

  deleteById(id: string): Promise<void> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
  replaceById(id: string, objectNode: ObjectNode): Promise<void> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
  updateAll(
    objectNode: ObjectNode,
    where:
      | Condition<ObjectNode>
      | AndClause<ObjectNode>
      | OrClause<ObjectNode>
      | undefined,
  ): Count | PromiseLike<Count> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
  find(
    filter: Filter<ObjectNode> | undefined,
  ): ObjectNode[] | PromiseLike<ObjectNode[]> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
  count(
    where:
      | Condition<ObjectNode>
      | AndClause<ObjectNode>
      | OrClause<ObjectNode>
      | undefined,
  ): Count | PromiseLike<Count> {
    throw new HttpErrors.MethodNotAllowed('Method not implemented.');
  }
}
