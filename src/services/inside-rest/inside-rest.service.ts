import {IRestEntity} from '@jacquesparis/objects-model';
import {
  BindingScope,
  inject,
  injectable,
  Provider,
  service,
} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {isString} from 'lodash';
import {ApplicationService, CurrentContext} from './../application.service';
import {
  AllFinallyInterface,
  AllInterceptorInterface,
  EntityInterceptService,
} from './../entity-intercept/entity-intercept.service';
import {DATASTIRE_INSIDE_REST, INSIDE_REST_PROVIDER} from './inside-rest.const';
import {InsideRestDataSource} from './inside-rest.datasource';
import {InsideRestProvider} from './inside-rest.provider';

export interface InsideRestRepository {
  read(
    uri: string,
    authorization: string,
    acceptLanguage: string,
    sessionid: string | undefined,
  ): Promise<IRestEntity>;
}

export class InsideRestRepositoryProvider
  implements Provider<InsideRestRepository> {
  constructor(
    // insideRest must match the name property in the datasource json file
    @inject(DATASTIRE_INSIDE_REST)
    protected dataSource: InsideRestDataSource = new InsideRestDataSource(),
  ) {}

  value(): Promise<InsideRestRepository> {
    return getService(this.dataSource);
  }
}

class InsideRestInterceptor implements AllInterceptorInterface {
  public providerId: string = INSIDE_REST_PROVIDER;
  public serviceId = 'InsideRestService';
  public description = 'Initialize Inside Rest call request cache';

  async interceptRequest(ctx: CurrentContext): Promise<void> {
    this.insideRestService.startSharedResults(ctx);
  }
  constructor(private insideRestService: InsideRestService) {}
}

class InsideRestFinalTreatment implements AllFinallyInterface {
  providerId: string = INSIDE_REST_PROVIDER;
  public serviceId = 'InsideRestService';
  public description = 'Free Inside Rest call request cache';
  async finallyRequest(ctx: CurrentContext): Promise<void> {
    this.insideRestService.endSharedResults(ctx);
  }
  constructor(private insideRestService: InsideRestService) {}
}

class InsideRestContext {
  id?: string;
  copyToChildContext: boolean;
  loadedUris: {[uri: string]: object};
}
@injectable({scope: BindingScope.SINGLETON})
export class InsideRestService {
  private insideRestInterceptor: InsideRestInterceptor;
  private insideRestFinalTreatment: InsideRestFinalTreatment;
  public get runningRequestLoadedUris(): {
    [id: string]: {[uri: string]: object};
  } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appCtx = this.applicationService.getExtensionContext<any>(
      InsideRestProvider,
    );
    if (!('runningRequestLoadedUris' in appCtx)) {
      appCtx.runningRequestLoadedUris = {};
    }
    return appCtx.runningRequestLoadedUris;
  }
  constructor(
    @inject('services.InsideRestRepository')
    private insideRestRepository: InsideRestRepository,
    @service(EntityInterceptService)
    private entityInterceptService: EntityInterceptService,
    @service(ApplicationService) private applicationService: ApplicationService,
  ) {
    this.insideRestInterceptor = new InsideRestInterceptor(this);
    this.insideRestFinalTreatment = new InsideRestFinalTreatment(this);

    this.entityInterceptService.registerAllInterceptorService(
      this.insideRestInterceptor,
    );
    this.entityInterceptService.registerAllFinalTreatmentService(
      this.insideRestFinalTreatment,
    );
  }

  public getOpenedSessionId(ctx: CurrentContext): string | undefined {
    return isString(ctx.uriContext.uri.value.headers.sessionid) &&
      'null' !== ctx.uriContext.uri.value.headers.sessionid &&
      '' !== ctx.uriContext.uri.value.headers.sessionid &&
      'undefined' !== ctx.uriContext.uri.value.headers.sessionid
      ? ctx.uriContext.uri.value.headers.sessionid
      : undefined;
  }

  public startSharedResults(ctx: CurrentContext) {
    const insideRestCtx: InsideRestContext = this.getCtx(ctx);
    const sessionid = this.getOpenedSessionId(ctx);
    if (sessionid) {
      insideRestCtx.loadedUris = this.runningRequestLoadedUris[sessionid];
      insideRestCtx.id = sessionid;
      return;
    }
    insideRestCtx.id = '' + Math.ceil(Math.random() * 1000000000000000000000);
    this.runningRequestLoadedUris[insideRestCtx.id] = {};
    insideRestCtx.loadedUris = this.runningRequestLoadedUris[insideRestCtx.id];
  }
  public endSharedResults(ctx: CurrentContext) {
    if (this.getOpenedSessionId(ctx)) {
      return;
    }
    const insideRestCtx: InsideRestContext = this.getCtx(ctx);
    insideRestCtx.loadedUris = {};
    if (insideRestCtx.id && insideRestCtx.id in this.runningRequestLoadedUris) {
      delete this.runningRequestLoadedUris[insideRestCtx.id];
    }
  }

  private getCtx(ctx: CurrentContext): InsideRestContext {
    if (!ctx.insideRestContext) {
      ctx.insideRestContext = {
        copyToChildContext: true,
        loadedUris: {},
      };
    }
    return ctx.insideRestContext;
  }

  getLoadedEntity(
    uriId: string,
    insideRestCtx: InsideRestContext,
  ): IRestEntity {
    if (uriId in insideRestCtx.loadedUris) {
      return insideRestCtx.loadedUris[uriId];
    }
    for (const runningRequest of Object.keys(this.runningRequestLoadedUris)) {
      if (uriId in this.runningRequestLoadedUris[runningRequest]) {
        return this.runningRequestLoadedUris[runningRequest][uriId];
      }
    }
    return (undefined as unknown) as IRestEntity;
  }

  setLoadedEntity(
    entity: IRestEntity,
    uriId: string,
    insideRestCtx: InsideRestContext,
  ): IRestEntity {
    for (const runningRequest of Object.keys(this.runningRequestLoadedUris)) {
      if (uriId in this.runningRequestLoadedUris[runningRequest]) {
        this.runningRequestLoadedUris[runningRequest][uriId] = entity;
      }
    }
    insideRestCtx.loadedUris[uriId] = entity;
    return insideRestCtx.loadedUris[uriId];
  }

  async read(
    uri: string,
    ctx: CurrentContext,
    forceNewRead = false,
  ): Promise<IRestEntity> {
    const uriId: string =
      uri +
      '-' +
      (isString(ctx.accessRightsContext.authorization.value)
        ? ctx.accessRightsContext.authorization.value
        : 'anonymous') +
      '-' +
      ctx.uriContext.uri.value.acceptLanguage;
    const insideRestCtx: InsideRestContext = this.getCtx(ctx);
    if (!forceNewRead) {
      const result = this.getLoadedEntity(uriId, insideRestCtx);
      if (result) {
        return result;
      }
    }
    try {
      return this.setLoadedEntity(
        await this.insideRestRepository.read(
          uri,
          ctx.accessRightsContext.authorization.value,
          ctx.uriContext.uri.value.acceptLanguage,
          insideRestCtx.id,
        ),
        uriId,
        insideRestCtx,
      );
    } catch (error) {
      console.trace('failed to load', uriId, error);
      throw error;
    }
  }
}
