import {inject} from '@loopback/context';
import {service} from '@loopback/core';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {TransientEntityService} from '../services/transient-entity/transient-entity.service';
import {AbstractEntityInterceptor} from './abstract-entity.interceptor';

export class TransientEntityInterceptor extends AbstractEntityInterceptor<
  TransientEntityService
> {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
  ) {
    super(transientEntityService, ctx);
  }
}
