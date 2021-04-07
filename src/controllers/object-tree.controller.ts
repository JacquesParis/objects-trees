import {authorize} from '@loopback/authorization';
// Uncomment these imports to begin using these cool features!
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {ObjectNodeRepository} from '../repositories/object-node.repository';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
// import {inject} from '@loopback/context';
import {ObjectTreeService} from '../services/object-tree/object-tree.service';
import {ObjectTree} from './../models/object-tree.model';
import {AccessRightsTreeScope} from './../services/access-rights/access-rights-tree.const';
import {
  AccessRightsEntity,
  AccessRightsScope,
} from './../services/access-rights/access-rights.const';

export class ObjectTreeController {
  constructor(
    @service(ObjectTreeService)
    public objectTreeService: ObjectTreeService,
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
  ) {}

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.read],
  })
  @get('/object-trees/{treeId}', {
    responses: {
      '200': {
        description: 'Array of ObjectNode model instances',
        content: {
          'application/json': {
            schema: {
              items: getModelSchemaRef(ObjectTree),
            },
          },
        },
      },
    },
  })
  async findChildren(
    @param.path.string('treeId') treeId: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.objectTreeService.loadTree(treeId, ctx);
  }

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.read, AccessRightsTreeScope.searchOwner],
  })
  @get('/object-trees/owner/{ownerType}/{ownerName}', {
    responses: {
      '200': {
        description: 'ObjectTree model',
        content: {
          'application/json': {
            schema: {
              items: getModelSchemaRef(ObjectTree),
            },
          },
        },
      },
    },
  })
  async findOwnerTree(
    @param.path.string('ownerType') ownerType: string,
    @param.path.string('ownerName') ownerName: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.objectTreeService.getOwnerTree(ownerType, ownerName, ctx);
  }

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.read, AccessRightsTreeScope.searchTree],
  })
  @get(
    '/object-trees/tree/{ownerType}/{ownerName}/{namespaceType}/{namespaceName}/{treeType}/{treeName}',
    {
      responses: {
        '200': {
          description: 'ObjectTree model',
          content: {
            'application/json': {
              schema: {
                items: getModelSchemaRef(ObjectTree),
              },
            },
          },
        },
      },
    },
  )
  async findTree(
    @param.path.string('ownerType') ownerType: string,
    @param.path.string('ownerName') ownerName: string,
    @param.path.string('namespaceType') namespaceType: string,
    @param.path.string('namespaceName') namespaceName: string,
    @param.path.string('treeType') treeType: string,
    @param.path.string('treeName') treeName: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.objectTreeService.getTree(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
      ctx,
    );
  }

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.read, AccessRightsTreeScope.searchNamespace],
  })
  @get(
    '/object-trees/namespace/{ownerType}/{ownerName}/{namespaceType}/{namespaceName}',
    {
      responses: {
        '200': {
          description: 'ObjectTree model',
          content: {
            'application/json': {
              schema: {
                items: getModelSchemaRef(ObjectTree),
              },
            },
          },
        },
      },
    },
  )
  async findNamespaceTree(
    @param.path.string('ownerType') ownerType: string,
    @param.path.string('ownerName') ownerName: string,
    @param.path.string('namespaceType') namespaceType: string,
    @param.path.string('namespaceName') namespaceName: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.objectTreeService.getNamespaceTree(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      ctx,
    );
  }

  @authorize({
    resource: AccessRightsEntity.objectTree,
    scopes: [AccessRightsScope.read, AccessRightsTreeScope.searchNode],
  })
  @get(
    '/object-trees/node/{ownerType}/{ownerName}/{namespaceType}/{namespaceName}/{treeType}/{treeName}/{nodeType}/{nodeName}',
    {
      responses: {
        '200': {
          description: 'ObjectTree model',
          content: {
            'application/json': {
              schema: {
                items: getModelSchemaRef(ObjectTree),
              },
            },
          },
        },
      },
    },
  )
  async findNode(
    @param.path.string('ownerType') ownerType: string,
    @param.path.string('ownerName') ownerName: string,
    @param.path.string('namespaceType') namespaceType: string,
    @param.path.string('namespaceName') namespaceName: string,
    @param.path.string('treeType') treeType: string,
    @param.path.string('treeName') treeName: string,
    @param.path.string('nodeType') nodeType: string,
    @param.path.string('nodeName') nodeName: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectTree> {
    return this.objectTreeService.getNode(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
      nodeType,
      nodeName,
      ctx,
    );
  }
}
