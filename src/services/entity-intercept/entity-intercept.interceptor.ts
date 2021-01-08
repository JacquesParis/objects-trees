import {inject} from '@loopback/context';
import {service} from '@loopback/core';
import {AbstractEntityInterceptor} from '../../interceptors/abstract-entity.interceptor';
import {
  ApplicationService,
  CurrentContext,
  CURRENT_CONTEXT,
} from './../application.service';
import {EntityInterceptService} from './entity-intercept.service';

export class EntityInterceptInterceptor extends AbstractEntityInterceptor<
  EntityInterceptService
> {
  constructor(
    @service(EntityInterceptService)
    protected entityInterceptService: EntityInterceptService,
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
    @service(ApplicationService)
    protected applicationService: ApplicationService,
  ) {
    super(entityInterceptService, ctx, applicationService);
  }
}
