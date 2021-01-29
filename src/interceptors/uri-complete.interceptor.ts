/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InvocationContext,
  InvocationResult,
  ValueOrPromise,
} from '@loopback/context';
import {inject, service} from '@loopback/core';
import {RestBindings} from '@loopback/rest';
import {UriCompleteService} from '../services/uri-complete/uri-complete.service';
import {
  CurrentContext,
  CURRENT_CONTEXT,
} from './../services/application.service';
import {AbstractInterceptor} from './abstract.interceptor';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */

export class UriCompleteInterceptor extends AbstractInterceptor {
  static readonly BINDING_KEY = `interceptors.${UriCompleteInterceptor.name}`;
  constructor(
    @service(UriCompleteService)
    private uriCompleteService: UriCompleteService,
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
  ): Promise<ValueOrPromise<InvocationResult>> {
    await this.getUriParts(invocationCtx, this.ctx);

    const result = await next();
    try {
      const httpReq: any = await invocationCtx.get(RestBindings.Http.REQUEST, {
        optional: true,
      });
      const method = httpReq?.method;
      if (
        'GET' === method ||
        'POST' === method ||
        'PUT' === method ||
        'PATCH' === method
      ) {
        await this.getUriParts(invocationCtx, this.ctx);
        this.uriCompleteService.completeReturnedEntity(result, this.ctx);
      }

      // eslint-disable-next-line no-empty
    } catch (error) {}
    return result;
  }
}
