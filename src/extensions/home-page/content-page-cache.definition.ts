import {IJsonSchema} from '@jacquesparis/objects-model';
import {Getter, inject, service} from '@loopback/core';
import {Entity, model, property, repository} from '@loopback/repository';
import {DATASTORE_DB} from '../../constants';
import {DbDataSource} from '../../datasources/db.datasource';
import {
  ContentExtension,
  ContentExtensionRelations,
  ContentExtensionRepository,
  ContentExtensionService,
  ContentExtensionWithRelations,
} from '../../integration/content-extension.definition';
import {ObjectNodeRepository} from '../../repositories/object-node.repository';
import {ContentEntityService} from '../../services/content-entity/content-entity.service';
import {HOME_PAGE_PROVIDER} from './home-page.const';

@model()
export class PageCache extends Entity {
  @property({
    type: 'string',
  })
  body: string;
}

@model({settings: {strict: false}})
export class ContentPageCache extends ContentExtension<PageCache> {}

export type ContentPageCacheRelations = ContentExtensionRelations;

export type ContentPageCacheWithRelations = ContentExtensionWithRelations<PageCache>;

export class ContentPageCacheRepository extends ContentExtensionRepository<
  PageCache,
  typeof ContentPageCache.prototype.id
> {
  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ContentPageCache, dataSource, objectNodeRepositoryGetter);
  }
}

export class ContentPageCacheService extends ContentExtensionService<
  PageCache,
  typeof ContentPageCache.prototype.id
> {
  constructor(
    @service(ContentEntityService)
    protected contentEntityService: ContentEntityService,
    @repository(ContentPageCacheRepository)
    protected contentExtensionRepository: ContentPageCacheRepository,
  ) {
    super(
      HOME_PAGE_PROVIDER,
      ContentPageCacheService.name,
      contentEntityService,
      contentExtensionRepository,
      'ContentPageCache',
    );
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentPageCache: {
          type: 'object',
          title: 'Page cache',
          properties: {
            body: {
              type: 'string',
              title: 'Body response',
              default: '',
              required: true,
              'x-schema-form': {
                type: 'textarea',
              },
            },
          },
        },
      },
    };
  }
}
