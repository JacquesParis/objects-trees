import {IJsonSchema} from '@jacquesparis/objects-model';
import {Getter, inject} from '@loopback/core';
import {
  belongsTo,
  BelongsToAccessor,
  DefaultCrudRepository,
  Entity,
  model,
  property,
  repository,
} from '@loopback/repository';
import {ContentEntity} from '../models';
import {DATASTORE_DB} from './../constants';
import {DbDataSource} from './../datasources/db.datasource';
import {ObjectNode, ObjectNodeRelations} from './../models/object-node.model';
import {ObjectNodeRepository} from './../repositories/object-node.repository';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from './../services/content-entity/content-entity.service';

@model({settings: {strict: false}})
export class ContentExtenstion<T extends Entity> extends ContentEntity {
  @property({
    type: 'object',
  })
  content: T;

  @belongsTo(() => ObjectNode)
  objectNodeId: string;

  constructor(data?: Partial<T>) {
    super(data);
  }
}

export interface ContentExtenstionRelations {
  // describe navigational properties here
  objectNode: ObjectNodeRelations;
}

export type ContentExtenstionWithRelations<
  T extends Entity
> = ContentExtenstion<T> & ContentExtenstionRelations;

export class ContentExtenstionRepository<
  T extends Entity
> extends DefaultCrudRepository<
  ContentExtenstion<T>,
  typeof ContentExtenstion.prototype.id,
  ContentExtenstionRelations
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
    super(ContentExtenstion, dataSource);
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

export abstract class ContentExtenstionService<E extends Entity>
  implements ContentEntityServiceInterface {
  constructor(
    public contentEntityService: ContentEntityService,
    public contentExtenstionRepository: ContentExtenstionRepository<E>,
    protected contentTypeName: string,
  ) {
    this.contentEntityService.registerNewContentType(contentTypeName, this);
  }

  public get fieldName(): string {
    return (
      this.contentTypeName.charAt(0).toUpperCase() +
      this.contentTypeName.slice(1)
    );
  }

  public abstract getContentDefinition(): Promise<IJsonSchema>;

  public async deleteContents(
    entities: EntityWithContent[],
    fieldName = this.fieldName,
  ): Promise<void> {
    const contentIdsToDelete: string[] = entities
      .filter((entity) => {
        return entity[fieldName + 'Id'];
      })
      .map((entity) => entity[fieldName + 'Id']);
    await this.contentExtenstionRepository.deleteAll({
      id: {inq: contentIdsToDelete},
    });
  }

  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = this.fieldName,
  ): Promise<boolean> {
    const postedExtenstionId = entity[fieldName + 'Id'];
    const postedExtenstion = postedEntity[fieldName];
    if (undefined === postedExtenstion) {
      return false;
    }
    if (null === postedExtenstion || '' === postedExtenstion) {
      if (postedExtenstionId) {
        await this.contentExtenstionRepository.deleteById(postedExtenstionId);
        entity[fieldName + 'Id'] = null;
        return true;
      }
      return false;
    } else {
      if (postedExtenstionId) {
        await this.contentExtenstionRepository.updateById(postedExtenstionId, {
          content: postedExtenstion,
        });
        return false;
      } else {
        const newExtenstion = await this.contentExtenstionRepository.create({
          content: postedExtenstion,
          objectNodeId: entity.id,
        });
        entity[fieldName + 'Id'] = newExtenstion.id;
        return true;
      }
    }
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName = this.fieldName,
    args: {contentId: string},
  ): Promise<E> {
    const contentExtenstion = await this.contentExtenstionRepository.findById(
      args.contentId,
    );
    return contentExtenstion.content;
  }

  public async addTransientContent(
    entity: EntityWithContent,
    fieldName = this.fieldName,
  ): Promise<void> {
    if (entity[fieldName + 'Id']) {
      entity[fieldName] = await this.getContent(entity, fieldName, {
        contentId: entity[fieldName + 'Id'],
      });
    }
  }
}
