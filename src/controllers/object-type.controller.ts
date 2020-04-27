import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {ObjectType} from '../models';
import {ObjectTypeRepository} from '../repositories';

export class ObjectTypeController {
  constructor(
    @repository(ObjectTypeRepository)
    public objectTypeRepository: ObjectTypeRepository,
  ) {}

  @post('/object-types', {
    responses: {
      '200': {
        description: 'ObjectType model instance',
        content: {'application/json': {schema: getModelSchemaRef(ObjectType)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectType, {
            title: 'NewObjectType',
            exclude: ['id', 'uri'],
          }),
        },
      },
    })
    objectType: Omit<ObjectType, 'id'>,
  ): Promise<ObjectType> {
    return this.objectTypeRepository.create(objectType);
  }

  @get('/object-types/count', {
    responses: {
      '200': {
        description: 'ObjectType model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(ObjectType) where?: Where<ObjectType>,
  ): Promise<Count> {
    return this.objectTypeRepository.count(where);
  }

  @get('/object-types', {
    responses: {
      '200': {
        description: 'Array of ObjectType model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(ObjectType, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(ObjectType) filter?: Filter<ObjectType>,
  ): Promise<ObjectType[]> {
    return this.objectTypeRepository.find(filter);
  }

  @patch('/object-types', {
    responses: {
      '200': {
        description: 'ObjectType PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectType, {partial: true}),
        },
      },
    })
    objectType: ObjectType,
    @param.where(ObjectType) where?: Where<ObjectType>,
  ): Promise<Count> {
    return this.objectTypeRepository.updateAll(objectType, where);
  }

  @get('/object-types/{id}', {
    responses: {
      '200': {
        description: 'ObjectType model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(ObjectType, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ObjectType, {exclude: 'where'})
    filter?: FilterExcludingWhere<ObjectType>,
  ): Promise<ObjectType> {
    return this.objectTypeRepository.findById(id, filter);
  }

  @patch('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectType, {partial: true}),
        },
      },
    })
    objectType: ObjectType,
  ): Promise<void> {
    await this.objectTypeRepository.updateById(id, objectType);
  }

  @put('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() objectType: ObjectType,
  ): Promise<void> {
    await this.objectTypeRepository.replaceById(id, objectType);
  }

  @del('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.objectTypeRepository.deleteById(id);
  }
}
