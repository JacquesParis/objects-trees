import {inject} from '@loopback/context';
import {service} from '@loopback/core';
import {
  CurrentContext,
  CURRENT_CONTEXT,
} from './../services/application.service';
import {EntityDefinitionService} from './../services/entity-definition/entity-definition.service';
import {AbstractEntityInterceptor} from './abstract-entity.interceptor';

export class EntityDefinitionInterceptor extends AbstractEntityInterceptor<
  EntityDefinitionService
> {
  constructor(
    @service(EntityDefinitionService)
    protected entityDefinitionService: EntityDefinitionService,
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
  ) {
    super(entityDefinitionService, ctx);
  }
}
