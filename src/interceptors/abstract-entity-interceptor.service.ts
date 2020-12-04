import {IRestEntity} from '@jacquesparis/objects-model';
import {EntityName} from './../models/entity-name';
import {CurrentContext} from './../services/application.service';
export interface AbstractEntityInterceptorInterface {
  completeReturnedEntity(
    entityName: EntityName,
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void>;
  completeReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
  ): Promise<void>;
}
