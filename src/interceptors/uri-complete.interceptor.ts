/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  globalInterceptor,
  InvocationContext,
  InvocationResult,
  ValueOrPromise,
} from '@loopback/context';
import {RestBindings} from '@loopback/rest';
import * as _ from 'lodash';
import {toKebabCase} from '../helper/utils';
import {EntityName} from './../models/entity-name';
import {AbstractInterceptor} from './abstract.interceptor';
import {URI_INTERCEPTOR} from './constants';

type EntityType = {
  id?: string;
  uri?: string;
  entityName?: EntityName;
  [key: string]: any;
};

/**
 * This class will be bound to the application as an `Interceptor` during
 * `boot`
 */
@globalInterceptor(URI_INTERCEPTOR, {
  tags: {name: UriCompleteInterceptor.BINDING_KEY},
})
export class UriCompleteInterceptor extends AbstractInterceptor {
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
  ): Promise<ValueOrPromise<InvocationResult>> {
    const result = await next();
    try {
      const httpReq: any = await invocationCtx.get(RestBindings.Http.REQUEST, {
        optional: true,
      });
      const method = httpReq?.method;
      if ('GET' === method || 'POST' === method || 'PATCH' === method) {
        const uriParts = await this.getUriParts(invocationCtx);

        this.addUri(result, uriParts.baseUri, uriParts.objectUri);
      }
      // eslint-disable-next-line no-empty
    } catch (error) {}
    return result;
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
      result.forEach((item) => {
        this.addUri(item, baseUri, objectUri, deep);
      });
    } else if (_.isObject(result)) {
      if ('entityName' in result) {
        deep = 0;
        objectUri =
          '/' +
          this.getEntityUri((result as EntityType).entityName as string) +
          '/';
        delete (result as EntityType).entityName;
      }
      if ('id' in result) {
        (result as EntityType).uri =
          baseUri + objectUri + (result as EntityType).id;
      }
      Object.keys(result).forEach((key) => {
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
          const field = key.substr(0, key.length - 2);
          const entityUri: string = this.getEntityUri(field);
          if (entityUri === toKebabCase(field)) {
            (result as EntityType)[field + 'Uri'] = `${baseUri}/${objectUri}${
              (result as EntityType).id
            }/${entityUri}/${(result as EntityType)[key]}`;
          } else {
            (result as EntityType)[field + 'Uri'] = `${baseUri}/${entityUri}/${
              (result as EntityType)[key]
            }`;
          }
        }
      });
    }
  }
}
