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
import {DATASTORE_DB} from '../constants';
import {DbDataSource} from '../datasources/db.datasource';
import {ContentEntity} from '../models';
import {ObjectNode, ObjectNodeRelations} from '../models/object-node.model';
import {ObjectNodeRepository} from '../repositories/object-node.repository';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from '../services/content-entity/content-entity.service';

@model({settings: {strict: false}})
export class ContentExtension<T extends Entity> extends ContentEntity {
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

export interface ContentExtensionRelations {
  // describe navigational properties here
  objectNode: ObjectNodeRelations;
}

export type ContentExtensionWithRelations<T extends Entity> = ContentExtension<
  T
> &
  ContentExtensionRelations;

export class ContentExtensionRepository<
  T extends Entity
> extends DefaultCrudRepository<
  ContentExtension<T>,
  typeof ContentExtension.prototype.id,
  ContentExtensionRelations
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
    super(ContentExtension, dataSource);
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

export abstract class ContentExtensionService<E extends Entity>
  implements ContentEntityServiceInterface {
  constructor(
    protected contentEntityService: ContentEntityService,
    protected contentExtensionRepository: ContentExtensionRepository<E>,
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
    await this.contentExtensionRepository.deleteAll({
      id: {inq: contentIdsToDelete},
    });
  }

  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = this.fieldName,
  ): Promise<boolean> {
    const postedExtensionId = entity[fieldName + 'Id'];
    const postedExtension = postedEntity[fieldName];
    if (undefined === postedExtension) {
      return false;
    }
    if (null === postedExtension || '' === postedExtension) {
      if (postedExtensionId) {
        await this.contentExtensionRepository.deleteById(postedExtensionId);
        entity[fieldName + 'Id'] = null;
        return true;
      }
      return false;
    } else {
      if (postedExtensionId) {
        await this.contentExtensionRepository.updateById(postedExtensionId, {
          content: postedExtension,
        });
        return false;
      } else {
        const newExtension = await this.contentExtensionRepository.create({
          content: postedExtension,
          objectNodeId: entity.id,
        });
        entity[fieldName + 'Id'] = newExtension.id;
        return true;
      }
    }
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName = this.fieldName,
    args: {contentId: string},
  ): Promise<E> {
    const contentExenstion = await this.contentExtensionRepository.findById(
      args.contentId,
    );
    return contentExenstion.content;
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
