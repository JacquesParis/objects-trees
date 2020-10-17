/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
import {
  globalInterceptor,
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/context';
import {RestBindings} from '@loopback/rest';
import * as _ from 'lodash';
import {camelToKebabCase} from '../helper/utils';

type EntityType = {
  id?: string;
  uri?: string;
  baseObjectUri?: string;
  [key: string]: any;
};

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor('uri', {tags: {name: UriCompleteInterceptor.BINDING_KEY}})
export class UriCompleteInterceptor implements Provider<Interceptor> {
  static readonly BINDING_KEY = `interceptors.${UriCompleteInterceptor.name}`;
  /*
  constructor() {}
  */

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
    const result = await next();
    try {
      const httpReq = await invocationCtx.get(RestBindings.Http.REQUEST, {
        optional: true,
      });
      const method = httpReq?.method;
      if ('GET' === method || 'POST' === method) {
        const protocol = await invocationCtx.get(RestBindings.PROTOCOL, {
          optional: true,
        });
        const host = await invocationCtx.get(RestBindings.HOST, {
          optional: true,
        });
        const port = await invocationCtx.get(RestBindings.PORT, {
          optional: true,
        });
        const baseUrl = httpReq?.baseUrl;
        const path = httpReq?.path;
        this.addUri(
          result,
          protocol + '://' + host + ':' + port + baseUrl,
          path + (path?.endsWith('/') ? '' : '/'),
        );
      }
    } catch (error) {}
    return result;
  }

  protected getEntityUri(entityName: string): string {
    switch (entityName) {
      case 'objectType':
      case 'subObjectType':
        return 'object-types';
      default:
        return camelToKebabCase(entityName);
    }
  }

  protected addUri(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: EntityType | EntityType[] | any,
    baseUri: string,
    objectUri: string,
    deep = 0,
  ) {
    if (deep > 2) {
      return;
    }
    if (_.isArray(result)) {
      result.forEach(item => {
        this.addUri(item, baseUri, objectUri, deep);
      });
    } else if (_.isObject(result)) {
      if ('baseObjectUri' in result && (result as EntityType).baseObjectUri) {
        objectUri = <string>(result as EntityType).baseObjectUri;
      }
      if ('id' in result) {
        (result as EntityType).uri =
          baseUri + objectUri + (result as EntityType).id;
      }
      Object.keys(result).forEach(key => {
        if (
          _.isObject((result as EntityType)[key]) ||
          _.isArray((result as EntityType)[key])
        ) {
          this.addUri(
            (result as EntityType)[key],
            baseUri,
            `${objectUri}${(result as EntityType).id}/${this.getEntityUri(
              key,
            )}/`,
            deep + 1,
          );
        } else if (
          _.isString((result as EntityType)[key]) &&
          key.endsWith('Id')
        ) {
          (result as EntityType)[
            key.substr(0, key.length - 2) + 'Uri'
          ] = `${baseUri}/${this.getEntityUri(key.substr(0, key.length - 2))}/${
            (result as EntityType)[key]
          }`;
        }
      });
    }
  }
}
