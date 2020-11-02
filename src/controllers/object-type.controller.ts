import {service} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {ObjectType} from '../models';
import {ObjectSubType} from './../models/object-sub-type.model';
import {ObjectSubTypeRepository} from './../repositories/object-sub-type.repository';
import {ObjectTypeRepository} from './../repositories/object-type.repository';
import {ObjectTypeService} from './../services/object-type.service';

export class ObjectTypeController {
  constructor(
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
    @repository(ObjectTypeRepository)
    public objectTypeRepository: ObjectTypeRepository,
    @repository(ObjectSubTypeRepository)
    public objectSubTypeRepository: ObjectSubTypeRepository,
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

  @patch('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType PATCH success',
        content: {'application/json': {schema: getModelSchemaRef(ObjectType)}},
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
  ): Promise<ObjectType> {
    return this.objectTypeService.modifyById(id, objectType);
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

  @post('/object-types/{id}/object-sub-types', {
    responses: {
      '200': {
        description: 'ObjectType model instance',
        content: {
          'application/json': {schema: getModelSchemaRef(ObjectSubType)},
        },
      },
    },
  })
  async createSubType(
    @param.path.string('id') id: typeof ObjectType.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectSubType, {
            title: 'NewObjectSubTypeInObjectType',
            exclude: ['id', 'uri', 'objectTypeId'],
            optional: ['objectTypeId'],
          }),
        },
      },
    })
    objectSubType: Omit<Omit<ObjectSubType, 'id'>, 'uri'>,
  ): Promise<ObjectSubType> {
    return this.objectTypeRepository.objectSubTypes(id).create(objectSubType);
  }

  @patch('/object-types/{objectTypeId}/object-sub-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectSubType PATCH success',
        content: {
          'application/json': {schema: getModelSchemaRef(ObjectSubType)},
        },
      },
    },
  })
  async updateSubTypeById(
    @param.path.string('objectTypeId') objectTypeId: string,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectSubType, {partial: true}),
        },
      },
    })
    objectSubType: ObjectSubType,
  ): Promise<ObjectSubType> {
    const where = {
      id: id,
    };
    await this.objectTypeRepository
      .objectSubTypes(objectTypeId)
      .patch(objectSubType, where);
    return this.objectSubTypeRepository.findById(id);
  }

  @del('/object-types/{objectTypeId}/object-sub-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectSubType DELETE success',
      },
    },
  })
  async deleteSubTypeById(
    @param.path.string('objectTypeId') objectTypeId: string,
    @param.path.string('id') id: string,
  ): Promise<void> {
    const where = {
      id: id,
    };
    await this.objectTypeRepository.objectSubTypes(objectTypeId).delete(where);
  }

  /*

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

  @patch('/object-types/{id}/object-sub-types', {
    responses: {
      '200': {
        description: 'ObjectType.ObjectSubType PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectSubType, {partial: true}),
        },
      },
    })
    objectSubType: Partial<ObjectSubType>,
    @param.query.object('where', getWhereSchemaFor(ObjectSubType))
    where?: Where<ObjectSubType>,
  ): Promise<Count> {
    return this.objectTypeRepository
      .objectSubTypes(id)
      .patch(objectSubType, where);
  }
  @get('/object-types/{id}/object-sub-types', {
    responses: {
      '200': {
        description: 'Array of ObjectType has many ObjectSubType',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(ObjectSubType)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<ObjectSubType>,
  ): Promise<ObjectSubType[]> {
    return this.objectTypeRepository.objectSubTypes(id).find(filter);
  }
*/
  /*
  @del('/object-types/{id}/object-sub-types', {
    responses: {
      '200': {
        description: 'ObjectType.ObjectSubType DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(ObjectSubType))
    where?: Where<ObjectSubType>,
  ): Promise<Count> {
    return this.objectTypeRepository.objectSubTypes(id).delete(where);
  }
  */

  /*
  @get('/object-sub-types/{id}/object-type', {
    responses: {
      '200': {
        description: 'ObjectType belonging to ObjectSubType',
        content: {
          'application/json': {
            schema: {
              contentType: 'array',
              items: getModelSchemaRef(ObjectType),
            },
          },
        },
      },
    },
  })
  async getObjectType(
    @param.path.string('id') id: typeof ObjectSubType.prototype.id,
  ): Promise<ObjectType> {
    return this.objectSubTypeRepository.objectType(id);
  }



  @patch('object-sub-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectSubType PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ObjectSubType, {partial: true}),
        },
      },
    })
    objectSubType: ObjectSubType,
  ): Promise<void> {
    await this.objectSubTypeRepository.updateById(id, objectSubType);
  }
  */
}
