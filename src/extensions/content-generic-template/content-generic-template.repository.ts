import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {DATASTORE_DB} from '../../constants';
import {DbDataSource} from '../../datasources/db.datasource';
import {ObjectNode} from '../../models/object-node.model';
import {ObjectNodeRepository} from '../../repositories/object-node.repository';
import {
  ContentGenericTemplate,
  ContentGenericTemplateRelations,
} from './content-generic-template.model';

export class ContentGenericTemplateRepository extends DefaultCrudRepository<
  ContentGenericTemplate,
  typeof ContentGenericTemplate.prototype.id,
  ContentGenericTemplateRelations
> {
  public readonly objectNode: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ContentGenericTemplate, dataSource);
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
