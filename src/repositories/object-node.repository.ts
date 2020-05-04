import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ObjectNode, ObjectNodeRelations, ObjectType} from '../models';
import {ObjectTypeRepository} from './object-type.repository';

export class ObjectNodeRepository extends DefaultCrudRepository<
  ObjectNode,
  typeof ObjectNode.prototype.id,
  ObjectNodeRelations
> {
  public readonly objectType: BelongsToAccessor<
    ObjectType,
    typeof ObjectNode.prototype.id
  >;

  public readonly parentNode: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('ObjectTypeRepository')
    protected objectTypeRepositoryGetter: Getter<ObjectTypeRepository>,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ObjectNode, dataSource);
    this.parentNode = this.createBelongsToAccessorFor(
      'parentNode',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'parentNode',
      this.parentNode.inclusionResolver,
    );
    this.objectType = this.createBelongsToAccessorFor(
      'objectType',
      objectTypeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'objectType',
      this.objectType.inclusionResolver,
    );
  }
}
