import {IRestEntity} from '@jacquesparis/objects-model';
import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {InsideRestDataSource} from '../../datasources';
import {DATASTIRE_INSIDE_REST} from './inside-rest.constant';

export interface InsideRestService {
  read(uri: string, authorization: string): Promise<IRestEntity>;
}

export class InsideRestServiceProvider implements Provider<InsideRestService> {
  constructor(
    // insideRest must match the name property in the datasource json file
    @inject(DATASTIRE_INSIDE_REST)
    protected dataSource: InsideRestDataSource = new InsideRestDataSource(),
  ) {}

  value(): Promise<InsideRestService> {
    return getService(this.dataSource);
  }
}
