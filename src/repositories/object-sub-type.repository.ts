import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ObjectSubType, ObjectSubTypeRelations, ObjectType} from '../models';
import {DATASTORE_DB} from './../constants';
import {ObjectTypeRepository} from './object-type.repository';

export class ObjectSubTypeRepository extends DefaultCrudRepository<
  ObjectSubType,
  typeof ObjectSubType.prototype.id,
  ObjectSubTypeRelations
> {
  public readonly objectType: BelongsToAccessor<
    ObjectType,
    typeof ObjectSubType.prototype.id
  >;

  public readonly objectSubType: HasOneRepositoryFactory<
    ObjectType,
    typeof ObjectSubType.prototype.id
  >;

  public readonly subObjectType: BelongsToAccessor<
    ObjectType,
    typeof ObjectSubType.prototype.id
  >;

  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectTypeRepository')
    protected objectTypeRepositoryGetter: Getter<ObjectTypeRepository>,
  ) {
    super(ObjectSubType, dataSource);
    this.subObjectType = this.createBelongsToAccessorFor(
      'subObjectType',
      objectTypeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'subObjectType',
      this.subObjectType.inclusionResolver,
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
