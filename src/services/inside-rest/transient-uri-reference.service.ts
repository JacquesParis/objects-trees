import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {indexOf, isArray, isObject, isString} from 'lodash';
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

  private isUriObjectReference(key: string, ctx: CurrentContext) {
    return (
      key.endsWith('ObjectTreeUri') ||
      key.endsWith('ObjectNodeUri') ||
      key.endsWith('ObjectTypeUri')
    );
  }

  private isExcludedKey(key: string, ctx: CurrentContext) {
    return -1 < indexOf(['aclList', 'entityCtx'], key);
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    for (const key in entity) {
      if (
        key.endsWith('Uri') &&
        entity[key] &&
        isString(entity[key]) &&
        this.isUriObjectReference(key, ctx)
      ) {
        const uri = entity[key];
        const attribute = key.substr(0, key.length - 3);
        if (undefined === entity[attribute]) {
          try {
            entity[attribute] = await this.insideRestService.read(uri, ctx);
          } catch (error) {
            entity[attribute] = error.message;
          }
        }
      }
      if (!this.isExcludedKey(key, ctx)) {
        if (isArray(entity[key])) {
          for (const subEntity of entity[key]) {
            await this.completeReturnedEntity(subEntity, ctx);
          }
        } else if (isObject(entity[key])) {
          await this.completeReturnedEntity(entity[key], ctx);
        }
      }
    }
  }
}
