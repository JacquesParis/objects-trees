import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import * as _ from 'lodash';
import {ObjectNode} from '../models';
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
  ) {
    this.ready = new Promise<void>((resolve, reject) => {
      this.initTree().then(
        () => {
          resolve();
        },
        error => {
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

  async loadChilds(treeId: string): Promise<ObjectNode[]> {
    return this.objectNodeService.searchByTreeId(treeId);
  }
}
