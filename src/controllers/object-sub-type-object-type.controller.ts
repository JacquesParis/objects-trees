import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  ObjectSubType,
  ObjectType,
} from '../models';
import {ObjectSubTypeRepository} from '../repositories';

export class ObjectSubTypeObjectTypeController {
  constructor(
    @repository(ObjectSubTypeRepository)
    public objectSubTypeRepository: ObjectSubTypeRepository,
  ) { }

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
}
