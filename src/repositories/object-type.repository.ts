import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  Filter,
  HasManyRepositoryFactory,
  Options,
  repository,
} from '@loopback/repository';
import {ObjectstreesApplication} from '..';
import {DbDataSource} from '../datasources';
import {ObjectSubType, ObjectType, ObjectTypeRelations} from '../models';
import {ObjectSubTypeRepository} from './object-sub-type.repository';

function camelToKebabCase(str: string) {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

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
    @inject('datasources.db') dataSource: DbDataSource,
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

  public async find(
    filter?: Filter<ObjectType>,
    options?: Options,
  ): Promise<(ObjectType & ObjectTypeRelations)[]> {
    const result = await super.find(filter, options);
    result.forEach(objectType => {
      objectType.uri = `${ObjectstreesApplication.serverBase}/object-types/${objectType.id}`;
    });
    return result;
  }
}
