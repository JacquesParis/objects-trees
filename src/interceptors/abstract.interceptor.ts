import {
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {toCamelCase, toKebabCase} from '../helper/utils';
import {EntityName} from './../models/entity-name';

export abstract class AbstractInterceptor implements Provider<Interceptor> {
  abstract value(): ValueOrPromise<Interceptor>;
  abstract intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<ValueOrPromise<InvocationResult>>;

  protected async getUriParts(
    invocationCtx: InvocationContext,
  ): Promise<{baseUri: string; objectUri: string}> {
    const httpReq: Request = (await invocationCtx.get(
      RestBindings.Http.REQUEST,
      {
        optional: true,
      },
    )) as Request;
    // httpReq.headers.host  ='127.0.0.1:3000'
    const host = httpReq.headers.host;
    const protocol = await invocationCtx.get(RestBindings.PROTOCOL, {
      optional: true,
    });

    const baseUrl = httpReq?.baseUrl;
    const path = httpReq?.path;
    const baseUri = protocol + '://' + host + baseUrl;
    const objectUri = path + (path?.endsWith('/') ? '' : '/');
    return {
      baseUri: baseUri,
      objectUri: objectUri,
    };
  }

  protected getEntityName(objectUri: string, baseUri: string): EntityName {
    const relativeObjectUri = objectUri.replace(baseUri, '');
    const entityUri = relativeObjectUri
      .substr('/' === relativeObjectUri.charAt(0) ? 1 : 0)
      .split('/')[0];
    const camelCase = toCamelCase(entityUri.substr(0, entityUri.length - 1));
    return EntityName[camelCase as keyof typeof EntityName];
  }
  protected getEntityUri(entityName: EntityName | string): string {
    if (entityName.endsWith('ObjectNode')) {
      return 'object-nodes';
    }
    if (entityName.endsWith('ObjectTree')) {
      return 'object-trees';
    }
    if (entityName.endsWith('ObjectType')) {
      return 'object-types';
    }
    switch (entityName) {
      case EntityName.objectType:
      case 'subObjectType':
        return 'object-types';
      case EntityName.objectNode:
      case 'parentNode':
      case 'parentAcl':
      case 'parentOwner':
      case 'parentNamespace':
      case 'parentTree':
        return 'object-nodes';
      default:
        if (entityName in EntityName) {
          return toKebabCase(entityName) + 's';
        }
        return toKebabCase(entityName);
    }
  }
}
