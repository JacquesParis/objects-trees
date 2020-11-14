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
    const baseUri = protocol + '://' + host + ':' + port + baseUrl;
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
    return EntityName[
      (camelCase.charAt(0) + camelCase.substr(1)) as keyof typeof EntityName
    ];
  }
  protected getEntityUri(entityName: EntityName | string): string {
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
