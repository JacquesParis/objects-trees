import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ObjectSubType, ObjectType, ObjectTypeRelations} from '../models';
import {DATASTORE_DB} from './../constants';
import {ObjectSubTypeRepository} from './object-sub-type.repository';

export class ObjectTypeRepository extends DefaultCrudRepository<
  ObjectType,
  typeof ObjectType.prototype.id,
  ObjectTypeRelations
> {
  public readonly objectSubTypes: HasManyRepositoryFactory<
    ObjectSubType,
    typeof ObjectType.prototype.id
  >;

  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectSubTypeRepository')
    protected objectSubTypeRepositoryGetter: Getter<ObjectSubTypeRepository>,
  ) {
    super(ObjectType, dataSource);
    this.objectSubTypes = this.createHasManyRepositoryFactoryFor(
      'objectSubTypes',
      objectSubTypeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'objectSubTypes',
      this.objectSubTypes.inclusionResolver,
    );
  }
}
