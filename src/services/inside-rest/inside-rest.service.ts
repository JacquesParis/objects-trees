import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, inject, injectable, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {CurrentContext} from './../application.service';
import {DATASTIRE_INSIDE_REST} from './inside-rest.const';
import {InsideRestDataSource} from './inside-rest.datasource';

export interface InsideRestRepository {
  read(uri: string, authorization: string): Promise<IRestEntity>;
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

@injectable({scope: BindingScope.SINGLETON})
export class InsideRestService {
  constructor(
    @inject('services.InsideRestRepository')
    private insideRestRepository: InsideRestRepository,
  ) {}
  async read(uri: string, ctx: CurrentContext): Promise<IRestEntity> {
    if (!ctx.insideRestContext) {
      ctx.insideRestContext = {};
    }
    if (!(uri in ctx.insideRestContext)) {
      ctx.insideRestContext[uri] = await this.insideRestRepository.read(
        uri,
        ctx.accessRightsContext.authorization.value,
      );
    }

    return ctx.insideRestContext[uri];
  }
}
