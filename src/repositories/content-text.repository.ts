import {DefaultCrudRepository} from '@loopback/repository';
import {ContentText, ContentTextRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ContentTextRepository extends DefaultCrudRepository<
  ContentText,
  typeof ContentText.prototype.id,
  ContentTextRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ContentText, dataSource);
  }
}
