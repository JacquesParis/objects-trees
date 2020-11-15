import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ContentFile, ContentFileRelations} from '../models';
import {DATASTORE_DB} from './../constants';

export class ContentFileRepository extends DefaultCrudRepository<
  ContentFile,
  typeof ContentFile.prototype.id,
  ContentFileRelations
> {
  constructor(@inject(DATASTORE_DB) dataSource: DbDataSource) {
    super(ContentFile, dataSource);
  }
}
