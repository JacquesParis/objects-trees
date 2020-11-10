import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, service} from '@loopback/core';
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
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {ObjectSubType} from './../models/object-sub-type.model';
import {
  AccessRightsEntity,
  AccessRightsScope,
} from './../services/access-rights.service';
import {ObjectTypeService} from './../services/object-type.service';

export class ObjectTypeController {
  constructor(
    @service(ObjectTypeService)
    public objectTypeService: ObjectTypeService,
  ) {}

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectType,
    scopes: [AccessRightsScope.create],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectType> {
    return this.objectTypeService.add(objectType, ctx);
  }

  @authorize({
    resource: AccessRightsEntity.objectType,
    scopes: [AccessRightsScope.read],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectType[]> {
    return this.objectTypeService.search(ctx);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectType,
    scopes: [AccessRightsScope.update],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectType> {
    return this.objectTypeService.modifyById(id, objectType, ctx);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectType,
    scopes: [AccessRightsScope.delete],
  })
  @del('/object-types/{id}', {
    responses: {
      '204': {
        description: 'ObjectType DELETE success',
      },
    },
  })
  deleteById(
    @param.path.string('id') id: string,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<void> {
    return this.objectTypeService.removeById(id, ctx);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectSubType,
    scopes: [AccessRightsScope.create],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectSubType> {
    return this.objectTypeService.createSubType(id as string, objectSubType);
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectSubType,
    scopes: [AccessRightsScope.update],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<ObjectSubType> {
    return this.objectTypeService.modifySubTypeById(
      objectTypeId,
      id,
      objectSubType,
    );
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.objectSubType,
    scopes: [AccessRightsScope.delete],
  })
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
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<void> {
    await this.objectTypeService.removeSubTypeById(objectTypeId, id);
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
