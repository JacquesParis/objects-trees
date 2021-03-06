import {inject} from '@loopback/context';
import {
  InvocationContext,
  InvocationResult,
  service,
  ValueOrPromise,
} from '@loopback/core';
import {ServerResponse} from 'http';
import {every, isObject} from 'lodash';
import {ApplicationError} from '../helper/application-error';
import {RestEntity} from '../models';
import {AccessRightsService} from '../services/access-rights/access-rights.service';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {ValueResult} from './../helper/method-value-result';
import {AbstractInterceptor} from './abstract.interceptor';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
export class AccessRightsInterceptor extends AbstractInterceptor {
  static readonly BINDING_KEY = `interceptors.${AccessRightsInterceptor.name}`;
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
          let cleanDone = false;
          if (result[0]?.uri) {
            const uriParts = await this.getUriParts(invocationCtx, this.ctx);
            const entityName = this.getEntityName(
              result[0]?.uri,
              uriParts.baseUri,
            );

            if (
              every(result, (oneResult) => {
                return (
                  this.getEntityName(oneResult.uri, uriParts.baseUri) ===
                  entityName
                );
              })
            ) {
              await this.accessRightsService.cleanReturnedEntities(
                entityName,
                result,
                this.ctx,
              );
              cleanDone = true;
            }
          } else {
            throw ApplicationError.forbidden();
          }
          if (!cleanDone) {
            for (const oneResult of result) {
              if (oneResult?.uri) {
                const uriParts = await this.getUriParts(
                  invocationCtx,
                  this.ctx,
                );
                const entityName = this.getEntityName(
                  oneResult.uri,
                  uriParts.baseUri,
                );

                await this.accessRightsService.cleanReturnedEntity(
                  entityName,
                  oneResult,
                  this.ctx,
                );
              } else {
                throw ApplicationError.forbidden();
              }
            }
          }
        }
      } else if (
        isObject(result) &&
        !(result instanceof ServerResponse) &&
        !(result instanceof ValueResult)
      ) {
        const entity: RestEntity = result as RestEntity;
        if (entity?.uri) {
          const uriParts = await this.getUriParts(invocationCtx, this.ctx);
          const entityName = this.getEntityName(entity.uri, uriParts.baseUri);

          await this.accessRightsService.cleanReturnedEntity(
            entityName,
            result,
            this.ctx,
          );
        } else {
          const uriParts = await this.getUriParts(invocationCtx, this.ctx);
          if (-1 === ['/explorer/openapi.json/'].indexOf(uriParts.objectUri)) {
            console.trace('missing rights', uriParts);
            throw ApplicationError.forbidden();
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
