import {IJsonSchema} from '@jacquesparis/objects-model';
import {Getter} from '@loopback/core';
import {
  belongsTo,
  BelongsToAccessor,
  DefaultCrudRepository,
  Entity,
  model,
  property,
} from '@loopback/repository';
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
  T extends Entity,
  ID extends string | undefined
> extends DefaultCrudRepository<
  ContentExtension<T>,
  ID,
  ContentExtensionRelations
> {
  public readonly objectNode: BelongsToAccessor<ObjectNode, ID>;

  constructor(
    entityClass: typeof Entity & {
      prototype: ContentExtension<T>;
    },
    dataSource: DbDataSource,
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(entityClass, dataSource);
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

export abstract class ContentExtensionService<
  E extends Entity,
  ID extends string | undefined
> implements ContentEntityServiceInterface {
  constructor(
    public providerId: string,
    public serviceId: string,
    protected contentEntityService: ContentEntityService,
    protected contentExtensionRepository: ContentExtensionRepository<E, ID>,
    protected contentTypeName: string,
  ) {
    this.contentEntityService.registerNewContentType(contentTypeName, this);
  }

  public get fieldName(): string {
    return (
      this.contentTypeName.charAt(0).toLowerCase() +
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
    args: {contentId: ID},
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
