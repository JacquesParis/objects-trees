import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ContentText, ContentTextRelations} from '../models';
import {DATASTORE_DB} from './../constants';
import {ObjectNode} from './../models/object-node.model';
import {ObjectNodeRepository} from './object-node.repository';

export class ContentTextRepository extends DefaultCrudRepository<
  ContentText,
  typeof ContentText.prototype.id,
  ContentTextRelations
> {
  public readonly objectNode: BelongsToAccessor<
    ObjectNode,
    typeof ContentText.prototype.id
  >;

  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ContentText, dataSource);
    this.objectNode = this.createBelongsToAccessorFor(
      'objectNode',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'objectNode',
      this.objectNode.inclusionResolver,
    );
  }
}
