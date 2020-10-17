import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
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
import {ObjectTypeService} from './../services/object-type.service';

export class ObjectTypeController {
  constructor(
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
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
    return this.objectTypeService.add(objectType);
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
    return this.objectTypeService.count(where);
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
    return this.objectTypeService.search(filter);
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
    return this.objectTypeService.updateAll(objectType, where);
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
  findById(
    @param.path.string('id') id: string,
    @param.filter(ObjectType, {exclude: 'where'})
    filter?: FilterExcludingWhere<ObjectType>,
  ): Promise<ObjectType> {
    return this.objectTypeService.findById(id, filter);
  }

  @patch('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType PATCH success',
      },
    },
  })
  updateById(
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
    return this.objectTypeService.modifyById(id, objectType);
  }

  @put('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType PUT success',
      },
    },
  })
  replaceById(
    @param.path.string('id') id: string,
    @requestBody() objectType: ObjectType,
  ): Promise<void> {
    return this.objectTypeService.replaceById(id, objectType);
  }

  @del('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType DELETE success',
      },
    },
  })
  deleteById(@param.path.string('id') id: string): Promise<void> {
    return this.objectTypeService.removeById(id);
  }
}
