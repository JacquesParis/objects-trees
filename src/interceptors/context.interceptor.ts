import {
  globalInterceptor,
  inject,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {CurrentContext, CURRENT_CONTEXT} from '../services/application.service';
import {CONTEXT_INTERCEPTOR} from './constants';

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor(CONTEXT_INTERCEPTOR, {tags: {name: 'Context'}})
export class ContextInterceptor implements Provider<Interceptor> {
  constructor(@inject(CURRENT_CONTEXT) public ctx: CurrentContext) {}

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
      return result;
    } catch (err) {
      // Add error handling logic here
      if (!err.statusCode) {
        throw new HttpErrors.ServiceUnavailable(err.msg);
      }
      throw err;
    }
  }
}
