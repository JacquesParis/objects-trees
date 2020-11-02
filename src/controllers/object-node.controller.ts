import {service} from '@loopback/core';
import {Filter, FilterExcludingWhere} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {ObjectNode} from '../models';
import {ObjectNodeService} from './../services/object-node.service';

export class ObjectNodeController {
  constructor(
    @service(ObjectNodeService)
    public objectNodeService: ObjectNodeService,
  ) {}

  @post('/object-nodes', {
    responses: {
      '200': {
        description: 'ObjectNode model instance',
        content: {'application/json': {schema: getModelSchemaRef(ObjectNode)}},
      },
    },
  })
  create(
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
    return this.objectNodeService.add(objectNode);
  }

  @get('/object-nodes', {
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
  async find(
    @param.filter(ObjectNode) filter?: Filter<ObjectNode>,
  ): Promise<ObjectNode[]> {
    return this.objectNodeService.find(filter);
  }
  @get('/object-nodes/{id}', {
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
    return this.objectNodeService.findById(id, filter);
  }

  @patch('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PATCH success',
        content: {'application/json': {schema: getModelSchemaRef(ObjectNode)}},
      },
    },
  })
  updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectNode, {partial: true}),
        },
      },
    })
    objectNode: ObjectNode,
  ): Promise<ObjectNode> {
    return this.objectNodeService.modifyById(id, objectNode);
  }

  @del('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.objectNodeService.removeById(id);
  }
  /*
  @put('/object-nodes/{id}', {
    responses: {
      '204': {
        description: 'ObjectNode PUT success',
      },
    },
  })
  replaceById(
    @param.path.string('id') id: string,
    @requestBody() objectNode: ObjectNode,
  ): Promise<void> {
    return this.objectNodeService.replaceById(id, objectNode);
  }
*/
  /*
@get('/object-nodes/{id}/object-type', {
  responses: {
    '200': {
      description: 'ObjectType belonging to ObjectNode',
      content: {
        'application/json': {
          schema: {type: 'array', items: getModelSchemaRef(ObjectType)},
        },
      },
    },
  },
})
async getObjectType(
  @param.path.string('id') id: typeof ObjectNode.prototype.id,
): Promise<ObjectType> {
  return this.objectNodeRepository.objectType(id);
}
*/

  /*
  @patch('/object-nodes', {
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
    return this.objectNodeService.updateAll(objectNode, where);
  }
*/
}
