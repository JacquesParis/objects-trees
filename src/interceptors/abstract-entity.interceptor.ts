import {
  InvocationContext,
  InvocationResult,
  ValueOrPromise,
} from '@loopback/core';
import {isObject} from 'lodash';
import {RestEntity} from '../models';
import {CurrentContext} from '../services/application.service';
import {AbstractEntityInterceptorInterface} from './abstract-entity-interceptor.service';
import {AbstractInterceptor} from './abstract.interceptor';

export abstract class AbstractEntityInterceptor<
  T extends AbstractEntityInterceptorInterface
> extends AbstractInterceptor {
  constructor(protected abstractEntityService: T, public ctx: CurrentContext) {
    super();
  }
  value() {
    return this.intercept.bind(this);
  }
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    // eslint-disable-next-line no-useless-catch
    try {
      // Add pre-invocation logic here
      const result = await next();
      // Add post-invocation logic here
      if (Array.isArray(result)) {
        if (result.length > 0) {
          if (result[0]?.uri) {
            const uriParts = await this.getUriParts(invocationCtx);
            const entityName = this.getEntityName(
              result[0]?.uri,
              uriParts.baseUri,
            );

            await this.abstractEntityService.completeReturnedEntities(
              entityName,
              result,
              this.ctx,
            );
          }
        }
      } else if (isObject(result)) {
        const entity: RestEntity = result as RestEntity;
        if (entity?.uri) {
          const uriParts = await this.getUriParts(invocationCtx);
          const entityName = this.getEntityName(entity.uri, uriParts.baseUri);

          await this.abstractEntityService.completeReturnedEntity(
            entityName,
            result,
            this.ctx,
          );
        }
      }

      return result;
    } catch (err) {
      throw err;
    }
  }
}
