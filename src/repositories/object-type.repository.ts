import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {ObjectType, ObjectTypeRelations, ObjectSubType} from '../models';
import {DbDataSource} from '../datasources';
import {inject, Getter} from '@loopback/core';
import {ObjectSubTypeRepository} from './object-sub-type.repository';

export class ObjectTypeRepository extends DefaultCrudRepository<
  ObjectType,
  typeof ObjectType.prototype.id,
  ObjectTypeRelations
> {

  public readonly objectSubTypes: HasManyRepositoryFactory<ObjectSubType, typeof ObjectType.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ObjectSubTypeRepository') protected objectSubTypeRepositoryGetter: Getter<ObjectSubTypeRepository>,
  ) {
    super(ObjectType, dataSource);
    this.objectSubTypes = this.createHasManyRepositoryFactoryFor('objectSubTypes', objectSubTypeRepositoryGetter,);
    this.registerInclusionResolver('objectSubTypes', this.objectSubTypes.inclusionResolver);
  }
}
