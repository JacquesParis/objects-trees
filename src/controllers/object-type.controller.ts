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
} from './../services/access-rights/access-rights.const';
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
    objectType: Omit<ObjectType, 'id'> & {name: string},
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
}
