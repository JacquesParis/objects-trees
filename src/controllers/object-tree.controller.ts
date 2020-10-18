// Uncomment these imports to begin using these cool features!
import {service} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {get, getModelSchemaRef, param} from '@loopback/rest';
import {ObjectNode} from '../models';
import {ObjectNodeRepository} from '../repositories/object-node.repository';
// import {inject} from '@loopback/context';
import {ObjectTreeService} from '../services/object-tree.service';

export class ObjectTreeController {
  constructor(
    @service(ObjectTreeService)
    public objectTreeService: ObjectTreeService,
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
  ) {}

  @get('/object-trees/id/{treeId}/nodes', {
    responses: {
      '200': {
        description: 'Array of ObjectNode model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(ObjectNode, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async findChildsNodes(
    @param.path.string('treeId') treeId: string,
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectTreeService.loadChilds(treeId);
  }

  @get('/object-trees/owner/{ownerType}/{ownerName}/nodes', {
    responses: {
      '200': {
        description: 'Array of ObjectNode model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(ObjectNode, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async findOwnerNodes(
    @param.path.string('ownerType') ownerType: string,
    @param.path.string('ownerName') ownerName: string,
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectTreeService.getOwnerTreeNodes(ownerType, ownerName);
  }

  @get(
    '/object-trees/tree/{ownerType}/{ownerName}/{namespaceType}/{namespaceName}/{treeType}/{treeName}/nodes',
    {
      responses: {
        '200': {
          description: 'Array of ObjectNode model instances',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: getModelSchemaRef(ObjectNode, {includeRelations: true}),
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
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectTreeService.getTreeNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
      treeType,
      treeName,
    );
  }

  @get(
    '/object-trees/namespace/{ownerType}/{ownerName}/{namespaceType}/{namespaceName}/nodes',
    {
      responses: {
        '200': {
          description: 'Array of ObjectNode model instances',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: getModelSchemaRef(ObjectNode, {includeRelations: true}),
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
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectTreeService.getNamespaceNodes(
      ownerType,
      ownerName,
      namespaceType,
      namespaceName,
    );
  }
  /*
  @post('/object-trees/{ownerType}/{ownerName}', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {'application/json': {schema: getModelSchemaRef(ObjectNode)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {
            title: 'NewObjectNode',
            exclude: ['id'],
          }),
        },
      },
    })
    objectNode: Omit<ObjectNode, 'id'>,
  ): Promise<ObjectNode> {
    return this.objectNodeRepository.create(objectNode);
  }

  @get('/object-trees/{ownerType}/{ownerName}/count', {
    responses: {
      '200': {
        description: 'ObjectNode model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(ObjectNode) where?: Where<ObjectNode>,
  ): Promise<Count> {
    return this.objectNodeRepository.count(where);
  }

  @patch('/object-trees/{ownerType}/{ownerName}', {
    responses: {
      '200': {
        description: 'ObjectNode PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {partial: true}),
        },
      },
    })
    objectNode: ObjectNode,
    @param.where(ObjectNode) where?: Where<ObjectNode>,
  ): Promise<Count> {
    return this.objectNodeRepository.updateAll(objectNode, where);
  }

  @get('/object-trees/{ownerType}/{ownerName}/{id}', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ObjectNode, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ObjectNode, {exclude: 'where'})
    filter?: FilterExcludingWhere<ObjectNode>,
  ): Promise<ObjectNode> {
    return this.objectNodeRepository.findById(id, filter);
  }

  @patch('/object-trees/{ownerType}/{ownerName}/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {partial: true}),
        },
      },
    })
    objectNode: ObjectNode,
  ): Promise<void> {
    await this.objectNodeRepository.updateById(id, objectNode);
  }

  @put('/object-trees/{ownerType}/{ownerName}/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() objectNode: ObjectNode,
  ): Promise<void> {
    await this.objectNodeRepository.replaceById(id, objectNode);
  }*/
  /*
  @del('/object-trees/id/{treeId}/nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.objectNodeRepository.deleteById(id);
  }*/
}
