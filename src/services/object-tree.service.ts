import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import * as _ from 'lodash';
import {ObjectNode} from '../models';
import {ObjectTree} from './../models/object-tree.model';
import {ContentEntityService} from './content-entity.service';
import {ObjectNodeService} from './object-node.service';
import {ObjectTypeService} from './object-type.service';

@bind({scope: BindingScope.SINGLETON})
export class ObjectTreeService {
  public ready: Promise<void>;
  constructor(
    @service(ObjectNodeService)
    public objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {
    this.ready = new Promise<void>((resolve, reject) => {
      this.initTree().then(
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  async initTree() {
    let rootType = await this.objectTypeService.searchByName('root');

    if (!rootType) {
      rootType = await this.objectTypeService.add({
        name: 'root',
        definition: {properties: {}},
        contentType: '',
      });
    }

    const root = await this.objectNodeService.searchOwner('root', 'root');
    if (!root) {
      await this.objectNodeService.add(
        {
          name: 'root',
          objectTypeId: rootType.id,
          owner: true,
          tree: true,
          namesapce: true,
          acl: true,
        },
        true,
      );
    }
  }

  /*
   * Add service methods here
   */

  async getOwnerTreeNodes(
    ownerType: string,
    ownerName: string,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const tree: ObjectNode = await this.objectNodeService.searchOwner(
      ownerType,
      ownerName,
    );
    if (!tree) {
      throw new HttpErrors.PreconditionFailed(
        'no owner ' + ownerType + ' ' + ownerName,
      );
    }

    return _.concat(
      tree,
      await this.objectNodeService.searchByTreeId(<string>tree.id),
    );
  }

  async getOwnerTree(
    ownerType: string,
    ownerName: string,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getOwnerTreeNodes(ownerType, ownerName);
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }

  async getTreeNodes(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const tree: ObjectNode = await this.objectNodeService.searchTree(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
    );
    if (!tree) {
      throw new HttpErrors.NotFound(
        'no tree ' +
          treeType +
          ' ' +
          treeName +
          'in namespace ' +
          namespaceType +
          ' ' +
          namespaceName +
          ' own by ' +
          ownerType +
          ' ' +
          ownerName,
      );
    }

    return _.concat(
      tree,
      await this.objectNodeService.searchByTreeId(<string>tree.id),
    );
  }

  async getTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
    treeType: string,
    treeName: string,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getTreeNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
    );
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }

  async getNamespaceNodes(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const namespace: ObjectNode = await this.objectNodeService.searchNamespace(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
    );
    if (!namespace) {
      throw new HttpErrors.NotFound(
        'no namespace ' +
          namespaceType +
          ' ' +
          namespaceName +
          ' own by ' +
          ownerType +
          ' ' +
          ownerName,
      );
    }

    return _.concat(
      namespace,
      await this.objectNodeService.searchByTreeId(<string>namespace.id),
    );
  }

  async gettNamespaceTree(
    ownerType: string,
    ownerName: string,
    namespaceType: string,
    namespaceName: string,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getNamespaceNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
    );
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }

  async loadChildrenNodes(treeId: string): Promise<ObjectNode[]> {
    const root = await this.objectNodeService.searchById(treeId);
    if (!root) {
      throw new HttpErrors.NotFound('No tree ' + treeId);
    }
    return _.concat(root, await this.objectNodeService.searchByTreeId(treeId));
  }

  async loadTree(treeId: string): Promise<ObjectTree> {
    const objectNodes = await this.loadChildrenNodes(treeId);
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }
}
