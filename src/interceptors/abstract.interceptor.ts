import {
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {toCamelCase} from '../helper/utils';
import {EntityName} from './../models/entity-name';
import {CurrentContext} from './../services/application.service';

export abstract class AbstractInterceptor implements Provider<Interceptor> {
  abstract value(): ValueOrPromise<Interceptor>;
  abstract intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<ValueOrPromise<InvocationResult>>;

  protected async getUriParts(
    invocationCtx: InvocationContext,
    ctx: CurrentContext,
  ): Promise<{baseUri: string; objectUri: string}> {
    return ctx.uriContext.uri.getOrSetValue(async () => {
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
    });
  }

  protected getEntityName(objectUri: string, baseUri: string): EntityName {
    const relativeObjectUri = objectUri.replace(baseUri, '');
    const entityUri = relativeObjectUri
      .substr('/' === relativeObjectUri.charAt(0) ? 1 : 0)
      .split('/')[0];
    const camelCase = toCamelCase(entityUri.substr(0, entityUri.length - 1));
    return EntityName[camelCase as keyof typeof EntityName];
  }
}
