import {repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  requestBody,
} from '@loopback/rest';
import {ObjectSubType, ObjectType} from '../models';
import {ObjectSubTypeRepository} from '../repositories';

export class ObjectSubTypeObjectTypeController {
  constructor(
    @repository(ObjectSubTypeRepository)
    public objectSubTypeRepository: ObjectSubTypeRepository,
  ) {}

  @get('/object-sub-types/{id}/object-type', {
    responses: {
      '200': {
        description: 'ObjectType belonging to ObjectSubType',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(ObjectType)},
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
}
