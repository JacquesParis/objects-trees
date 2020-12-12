import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
import {indexOf} from 'lodash';
import {EntityName} from '../../models';
import {ApplicationService, CurrentContext} from '../application.service';
import {AbstractEntityInterceptorInterface} from './../../interceptors/abstract-entity-interceptor.service';

export interface TransientEntityInterface {
  completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void>;
}

@injectable({scope: BindingScope.SINGLETON})
export class TransientEntityService
  implements AbstractEntityInterceptorInterface {
  private transientEntitys: {
    [resource in EntityName]?: TransientEntityInterface[];
  } = {};

  public registerTransientEntityService(
    resource: EntityName,
    transientEntity: TransientEntityInterface,
  ) {
    if (!this.transientEntitys[resource]) {
      this.transientEntitys[resource] = [];
    }
    this.transientEntitys[resource]?.push(transientEntity);
  }

  public registerTransientEntityTypeFunction<T extends IRestEntity>(
    resource: EntityName,
    objectType: string,
    transientFunction: (entity: T, ctx: CurrentContext) => Promise<void>,
  ) {
    this.registerTransientEntityService(
      resource,
      new (class implements TransientEntityInterface {
        async completeReturnedEntity(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<void> {
          if (-1 < indexOf(entity.entityCtx?.implementedTypes, objectType)) {
            return transientFunction(entity as T, ctx);
          }
        }
      })(),
    );
  }

  get ready(): Promise<void> {
    return this.appCtx.getExtensionContext('TransientEntityService').ready;
  }

  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
  ) {}

  async completeReturnedEntity(
    entityName: EntityName,
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    if (entityName in this.transientEntitys) {
      for (const transientEntity of this.transientEntitys[
        entityName
      ] as TransientEntityInterface[]) {
        await transientEntity.completeReturnedEntity(entity, ctx);
      }
    }
    if (!entity.entityCtx) {
      entity.entityCtx = {entityType: entityName};
    }
    entity.entityCtx.loaded = true;
  }

  public async completeReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
  ) {
    for (let childIndex = entities.length - 1; childIndex >= 0; childIndex--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity: any = entities[childIndex];
      await this.completeReturnedEntity(entityName, entity, ctx);
    }
  }
}
