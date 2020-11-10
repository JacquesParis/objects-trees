import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import * as _ from 'lodash';
import {ObjectNode} from '../models';
import {ObjectTree} from './../models/object-tree.model';
import {ObjectType} from './../models/object-type.model';
import {ApplicationService, CurrentContext} from './application.service';
import {ContentEntityService} from './content-entity.service';
import {ObjectNodeService} from './object-node.service';
import {ObjectTypeService} from './object-type.service';

@bind({scope: BindingScope.SINGLETON})
export class ObjectTreeService {
  public ready: Promise<void>;
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
    this.ready = new Promise<void>((resolve, reject) => {
      this.init().then(
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  async init() {
    const rootType: ObjectType = await this.appCtx.rootType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let newRootType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.ROOT,
        );

        if (!newRootType) {
          newRootType = await this.objectTypeService.add(
            {
              name: ApplicationService.OBJECT_TYPE_NAMES.ROOT,
              definition: {properties: {}},
              contentType: '',
            },
            new CurrentContext(),
          );
        }
        return newRootType;
      },
    );

    const tenantType: ObjectType = await this.appCtx.tenantType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let newType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.TENANT,
        );

        if (!newType) {
          newType = await this.objectTypeService.add(
            {
              name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
              definition: {
                properties: {
                  firstname: {
                    type: 'string',
                    title: 'Firstname',
                    default: '',
                    minLength: 2,
                    required: true,
                  },
                  lastname: {
                    type: 'string',
                    title: 'Lastname',
                    default: '',
                    minLength: 2,
                    required: true,
                  },
                  email: {
                    type: 'string',
                    title: 'Email',
                    default: '',
                    minLength: 2,
                    required: true,
                  },
                  address: {
                    type: 'string',
                    title: 'Address',
                    default: '',
                    minLength: 2,
                    required: false,
                  },
                },
              },
              contentType: '',
            },
            new CurrentContext(),
          );
        }
        return newType;
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      rootType.id as string,
      tenantType.id as string,
      {
        acl: true,
        name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
        namespace: true,
        owner: true,
        tree: true,
      },
    );

    await this.appCtx.rooteNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newRoot = await this.objectNodeService.searchOwner(
          ApplicationService.OBJECT_TYPE_NAMES.ROOT,
          ApplicationService.OBJECT_NODE_NAMES[
            ApplicationService.OBJECT_TYPE_NAMES.ROOT
          ],
        );
        if (!newRoot) {
          newRoot = await this.objectNodeService.add(
            {
              name:
                ApplicationService.OBJECT_NODE_NAMES[
                  ApplicationService.OBJECT_TYPE_NAMES.ROOT
                ],
              objectTypeId: rootType.id,
              owner: true,
              tree: true,
              namesapce: true,
              acl: true,
            },
            new CurrentContext(),
            true,
          );
        }
        return newRoot;
      },
    );
  }

  /*
   * Add service methods here
   */

  async getOwnerTreeNodes(
    ownerType: string,
    ownerName: string,
    ctx: CurrentContext,
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
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getOwnerTreeNodes(ownerType, ownerName, ctx);
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
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    await this.ready;
    const tree: ObjectNode = await this.objectNodeService.searchTreeNodes(
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
    ctx: CurrentContext,
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
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const objectNodes = await this.getNamespaceNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      ctx,
    );
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }

  async loadChildrenNodes(
    treeId: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode[]> {
    const root = await this.objectNodeService.searchById(treeId);
    if (!root) {
      throw new HttpErrors.NotFound('No tree ' + treeId);
    }
    return _.concat(root, await this.objectNodeService.searchByTreeId(treeId));
  }

  async loadTree(treeId: string, ctx: CurrentContext): Promise<ObjectTree> {
    const objectNodes = await this.loadChildrenNodes(treeId, ctx);
    return new ObjectTree(objectNodes[0]).init(
      objectNodes,
      this.contentEntityService,
      await this.objectTypeService.getAll(),
    );
  }
}
