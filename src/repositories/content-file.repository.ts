import {DefaultCrudRepository} from '@loopback/repository';
import {ContentFile, ContentFileRelations} from '../models';
import {DbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class ContentFileRepository extends DefaultCrudRepository<
  ContentFile,
  typeof ContentFile.prototype.id,
  ContentFileRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ContentFile, dataSource);
  }
}
