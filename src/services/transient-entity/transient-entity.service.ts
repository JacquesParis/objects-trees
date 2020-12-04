import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
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
    loadEntity = true,
  ): Promise<void> {
    if (loadEntity && entityName in this.transientEntitys) {
      for (const transientEntity of this.transientEntitys[
        entityName
      ] as TransientEntityInterface[]) {
        await transientEntity.completeReturnedEntity(entity, ctx);
      }
    }
    if (!entity.entityCtx) {
      entity.entityCtx = {};
    }
    entity.entityCtx.loaded = loadEntity;
  }

  public async completeReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
    loadEntity = true,
  ) {
    for (let childIndex = entities.length - 1; childIndex >= 0; childIndex--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity: any = entities[childIndex];
      await this.completeReturnedEntity(entityName, entity, ctx, loadEntity);
    }
  }
}
