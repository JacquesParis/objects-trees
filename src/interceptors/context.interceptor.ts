import {inject} from '@loopback/context';
import {
  globalInterceptor,
  InvocationContext,
  InvocationResult,
  service,
  ValueOrPromise,
} from '@loopback/core';
import {isObject} from 'lodash';
import {RestEntity} from '../models';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {ApplicationError} from './../helper/application-error';
import {AccessRightsService} from './../services/access-rights/access-rights.service';
import {AbstractInterceptor} from './abstract.interceptor';
import {CONTEXT_INTERCEPTOR} from './constants';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor(CONTEXT_INTERCEPTOR, {tags: {name: 'Context'}})
export class ContextInterceptor extends AbstractInterceptor {
  constructor(
    @service(AccessRightsService)
    private accessRightsService: AccessRightsService,
    @inject(CURRENT_CONTEXT) public ctx: CurrentContext,
  ) {
    super();
  }

  /**
   * This method is used by LoopBack context to produce an interceptor function
   * for the binding.
   *
   * @returns An interceptor function
   */
  value() {
    return this.intercept.bind(this);
  }

  /**
   * The logic to intercept an invocation
   * @param invocationCtx - Invocation context
   * @param next - A function to invoke next interceptor or the target method
   */
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

            await this.accessRightsService.cleanReturnedEntities(
              entityName,
              result,
              this.ctx,
            );
          } else {
            throw ApplicationError.forbiden();
          }
        }
      } else if (isObject(result)) {
        const entity: RestEntity = result as RestEntity;
        if (entity?.uri) {
          const uriParts = await this.getUriParts(invocationCtx);
          const entityName = this.getEntityName(entity.uri, uriParts.baseUri);

          await this.accessRightsService.cleanReturnedEntity(
            entityName,
            result,
            this.ctx,
          );
        } else {
          const uriParts = await this.getUriParts(invocationCtx);
          if (-1 === ['/explorer/openapi.json/'].indexOf(uriParts.objectUri)) {
            throw ApplicationError.forbiden();
          }
        }
      }

      return result;
    } catch (err) {
      // Add error handling logic here
      if (!err.statusCode) {
        throw ApplicationError.unexpectedError(err);
      }
      throw err;
    }
  }
}
