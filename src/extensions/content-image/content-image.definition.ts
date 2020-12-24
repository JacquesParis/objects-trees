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
import {CONTENT_IMAGE_PROVIDER} from './content-image.const';

@model()
export class Image extends Entity {
  @property({
    type: 'string',
  })
  base64: string;
  @property({
    type: 'string',
  })
  size: string;
  @property({
    type: 'string',
  })
  name: string;
  @property({
    type: 'string',
  })
  type: string;
}

@model({settings: {strict: false}})
export class ContentImage extends ContentExtension<Image> {}

export type ContentImageRelations = ContentExtensionRelations;

export type ContentImageWithRelations = ContentExtensionWithRelations<Image>;

export class ContentImageRepository extends ContentExtensionRepository<
  Image,
  typeof ContentImage.prototype.id
> {
  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ContentImage, dataSource, objectNodeRepositoryGetter);
  }
}

export class ContentImageService extends ContentExtensionService<
  Image,
  typeof ContentImage.prototype.id
> {
  constructor(
    @service(ContentEntityService)
    protected contentEntityService: ContentEntityService,
    @repository(ContentImageRepository)
    protected contentExtensionRepository: ContentImageRepository,
  ) {
    super(
      CONTENT_IMAGE_PROVIDER,
      ContentImageService.name,
      contentEntityService,
      contentExtensionRepository,
      'ContentImage',
    );
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentImage: {
          type: 'object',
          title: 'Image',
          'x-schema-form': {
            type: 'image',
          },
          properties: {
            base64: {type: 'string', required: false},
            size: {type: 'string', required: false},
            name: {type: 'string', required: false},
            type: {type: 'string', required: false},
            id: {type: 'string', required: false},
            uri: {type: 'string', required: false},
          },
        },
      },
    };
  }
}
