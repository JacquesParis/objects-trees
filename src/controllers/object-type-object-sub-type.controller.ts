import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {ObjectSubType, ObjectType} from '../models';
import {ObjectTypeRepository} from '../repositories';

export class ObjectTypeObjectSubTypeController {
  constructor(
    @repository(ObjectTypeRepository)
    protected objectTypeRepository: ObjectTypeRepository,
  ) {}

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
  async create(
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

  @patch('/object-types/{objectTypeId}/object-sub-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectSubType PATCH success',
      },
    },
  })
  async updateById(
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
  ): Promise<void> {
    const where = {
      id: id,
    };
    await this.objectTypeRepository
      .objectSubTypes(objectTypeId)
      .patch(objectSubType, where);
  }

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

  @del('/object-types/{objectTypeId}/object-sub-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectSubType DELETE success',
      },
    },
  })
  async deleteById(
    @param.path.string('objectTypeId') objectTypeId: string,
    @param.path.string('id') id: string,
  ): Promise<void> {
    const where = {
      id: id,
    };
    await this.objectTypeRepository.objectSubTypes(objectTypeId).delete(where);
  }
}
