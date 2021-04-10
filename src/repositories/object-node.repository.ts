import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  Filter,
  FilterExcludingWhere,
  Options,
  repository,
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {toStartCase} from '../helper';
import {ObjectNode, ObjectNodeRelations, ObjectType} from '../models';
import {DATASTORE_DB} from './../constants';
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

  public readonly parentOwner: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  public readonly parentTree: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  public readonly parentNamespace: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  public readonly parentACL: BelongsToAccessor<
    ObjectNode,
    typeof ObjectNode.prototype.id
  >;

  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
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
    this.parentOwner = this.createBelongsToAccessorFor(
      'parentOwner',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'parentOwner',
      this.parentOwner.inclusionResolver,
    );
    this.parentTree = this.createBelongsToAccessorFor(
      'parentTree',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'parentTree',
      this.parentTree.inclusionResolver,
    );
    this.parentNamespace = this.createBelongsToAccessorFor(
      'parentNamespace',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'parentNamespace',
      this.parentNamespace.inclusionResolver,
    );
    this.parentACL = this.createBelongsToAccessorFor(
      'parentACL',
      objectNodeRepositoryGetter,
    );
    this.registerInclusionResolver(
      'parentACL',
      this.parentACL.inclusionResolver,
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

  // to deal with retro-compatibility, before title existence
  private buildTitle(dataNode: ObjectNode | null) {
    if (dataNode && !dataNode.title) {
      if (dataNode.menuTitle) {
        dataNode.title = dataNode.menuTitle;
      } else if (dataNode.pageTitle) {
        dataNode.title = dataNode.pageTitle;
      } else if (dataNode.paragraphTitle) {
        dataNode.title = dataNode.paragraphTitle;
      } else if (dataNode.pageUrl) {
        dataNode.title = dataNode.pageUrl;
      } else if (dataNode.host) {
        dataNode.title =
          'http://' +
          dataNode.host +
          (dataNode.path ? '/site/' + dataNode.path : '');
      } else {
        dataNode.title = toStartCase(dataNode.name);
      }
    }
  }

  public async find(
    filter?: Filter<ObjectType>,
    options?: Options,
  ): Promise<(ObjectNode & ObjectNodeRelations)[]> {
    const result = await super.find(filter, options);
    if (result) {
      for (const type of result) {
        this.buildTitle(type);
      }
    }
    return result;
  }

  public async findById(
    id: typeof ObjectNode.prototype.id,
    filter?: FilterExcludingWhere<ObjectNode>,
    options?: Options,
  ): Promise<ObjectNode & ObjectNodeRelations> {
    const result = await super.findById(id, filter, options);
    this.buildTitle(result);
    return result;
  }
  public async findOne(
    filter?: Filter<ObjectNode>,
    options?: Options,
  ): Promise<(ObjectNode & ObjectNodeRelations) | null> {
    const result = await super.findOne(filter, options);
    this.buildTitle(result);
    return result;
  }
}
