import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {
  TransientEntityInterface,
  TransientEntityService,
} from '../transient-entity/transient-entity.service';
import {InsideRestService} from './inside-rest.service';
export class TransientUriReferenceService implements TransientEntityInterface {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
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
    if (entity.entityCtx?.jsonSchema?.properties) {
      for (const key in entity) {
        if (key.endsWith('Uri') && entity[key]) {
          const uri = entity[key];
          const attribute = key.substr(0, key.length - 3);
          if (
            undefined === entity[attribute] &&
            attribute + 'Id' in entity.entityCtx.jsonSchema.properties
          ) {
            try {
              entity[attribute] = await this.insideRestService.read(uri, ctx);
            } catch (error) {
              entity[attribute] = error.message;
            }
          }
        }
      }
    }
  }
}
