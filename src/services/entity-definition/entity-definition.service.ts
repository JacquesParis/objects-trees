import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
import {EntityName} from '../../models';
import {CurrentContext} from '../application.service';
import {AbstractEntityInterceptorInterface} from './../../interceptors/abstract-entity-interceptor.service';
import {ApplicationService} from './../application.service';

export interface EntityDefinitionInterface {
  completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void>;
}

@injectable({scope: BindingScope.SINGLETON})
export class EntityDefinitionService
  implements AbstractEntityInterceptorInterface {
  private entityDefinitions: {
    [resource in EntityName]?: EntityDefinitionInterface;
  } = {};

  public registerEntityDefinitionService(
    resource: EntityName,
    entityDefinition: EntityDefinitionInterface,
  ) {
    this.entityDefinitions[resource] = entityDefinition;
  }

  get ready(): Promise<void> {
    return this.appCtx.getExtensionContext('EntityDefinitionService').ready;
  }

  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
  ) {}

  async completeReturnedEntity(
    entityName: EntityName,
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    if (entityName in this.entityDefinitions) {
      await this.entityDefinitions[entityName]?.completeReturnedEntity(
        entity,
        ctx,
      );
    }
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
