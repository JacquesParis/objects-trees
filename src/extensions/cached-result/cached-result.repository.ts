import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../../datasources';
import {CachedResult, CachedResultRelations} from './cached-result.model';

export class CachedResultRepository extends DefaultCrudRepository<
  CachedResult,
  typeof CachedResult.prototype.id,
  CachedResultRelations
> {
  constructor(@inject('datasources.db') dataSource: DbDataSource) {
    super(CachedResult, dataSource);
  }
}
