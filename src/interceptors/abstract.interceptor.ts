import {
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {camelCase} from 'lodash';
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
  ): Promise<{
    baseUri: string;
    path: string;
    objectUri: string;
    method: string;
    host: string;
    protocol: string;
    acceptLanguages: string[];
    acceptLanguage: string;
  }> {
    ctx.uriContext.mainContext = true;
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
      const acceptLanguages: string[] = httpReq.acceptsLanguages();
      return {
        host: host as string,
        protocol: protocol as string,
        baseUri: baseUri,
        path: path,
        objectUri: objectUri,
        url: baseUri + objectUri,
        method: httpReq.method,
        headers: httpReq.headers,
        acceptLanguages: acceptLanguages,
        acceptLanguage:
          acceptLanguages && 0 < acceptLanguages.length
            ? acceptLanguages[0]
            : 'en-US',
      };
    });
  }

  protected getEntityName(objectUri: string, baseUri: string): EntityName {
    const relativeObjectUri = objectUri.replace(baseUri, '');
    const entityUri = relativeObjectUri
      .substr('/' === relativeObjectUri.charAt(0) ? 1 : 0)
      .split('/')[0];
    const entityCamelCase = camelCase(
      entityUri.substr(0, entityUri.length - 1),
    );
    return EntityName[entityCamelCase as keyof typeof EntityName];
  }
}
