import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  ObjectNode,
  ObjectType,
} from '../models';
import {ObjectNodeRepository} from '../repositories';

export class ObjectNodeObjectTypeController {
  constructor(
    @repository(ObjectNodeRepository)
    public objectNodeRepository: ObjectNodeRepository,
  ) { }

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
}
