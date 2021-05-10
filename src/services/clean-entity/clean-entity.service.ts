import {IRestEntity} from '@jacquesparis/objects-model';
import {inject, service} from '@loopback/core';
import {isArray, isObject} from 'lodash';
import {AbstractEntityInterceptorInterface} from '../../interceptors/abstract-entity-interceptor.service';
import {AbstractEntityInterceptor} from '../../interceptors/abstract-entity.interceptor';
import {EntityName} from './../../models/entity-name';
import {IRestEntityServer} from './../../models/rest-entity.model';
import {
  ApplicationService,
  CurrentContext,
  CURRENT_CONTEXT,
} from './../application.service';

export class CleanEntityService implements AbstractEntityInterceptorInterface {
  public async completeReturnedEntity(
    entityName: EntityName,
    entity: IRestEntityServer,
    ctx: CurrentContext,
  ): Promise<void> {
    if (isArray(entity.children)) {
      await this.completeReturnedEntities(entityName, entity.children, ctx);
    }
    if (isObject(entity.treeNode)) {
      await this.completeReturnedEntity(
        EntityName.objectNode,
        entity.treeNode,
        ctx,
      );
    }
    // remove entityCtx.implementedTypes
    if (entity.entityCtx) {
      delete entity.entityCtx.implementedTypes;
    }
    //remove entityName
    delete entity.entityName;
    // remove childrenEntityCtx
    delete entity.childrenEntityCtx;
    // remove owner tree namespace index
    delete entity.owner;
    delete entity.tree;
    delete entity.namespace;
    delete entity.index;
  }

  public async completeReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
  ): Promise<void> {
    for (const entity of entities) {
      await this.completeReturnedEntity(entityName, entity, ctx);
    }
  }
}

export class CleanEntityInterceptor extends AbstractEntityInterceptor<CleanEntityService> {
  constructor(
    @service(CleanEntityService)
    protected cleanEntityService: CleanEntityService,
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
    @service(ApplicationService)
    protected applicationService: ApplicationService,
  ) {
    super(cleanEntityService, ctx, applicationService);
  }
}
