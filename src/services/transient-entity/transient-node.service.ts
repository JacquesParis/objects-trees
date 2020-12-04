import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../application.service';
import {ContentEntityService} from './../content-entity/content-entity.service';
import {ObjectTypeService} from './../object-type.service';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './transient-entity.service';
export class TransientNodeService implements TransientEntityInterface {
  constructor(
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectNode,
      this,
    );
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectNode: ObjectNode = entity as ObjectNode;
    const objectType = await ctx.nodeContext.objectType.getOrSetValue(
      async () => this.objectTypeService.searchById(objectNode.objectTypeId),
    );

    await this.contentEntityService.addTransientContent(
      objectType.contentType,
      entity,
    );
  }
}
