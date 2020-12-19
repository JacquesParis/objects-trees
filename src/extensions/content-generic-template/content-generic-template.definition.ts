import {IJsonSchema} from '@jacquesparis/objects-model';
import {Getter, inject, service} from '@loopback/core';
import {Entity, model, property, repository} from '@loopback/repository';
import {
  ContentExtension,
  ContentExtensionRelations,
  ContentExtensionRepository,
  ContentExtensionService,
  ContentExtensionWithRelations,
} from '../../integration/content-extension.definition';
import {ContentEntityService} from '../../services/content-entity/content-entity.service';
import {DATASTORE_DB} from './../../constants';
import {DbDataSource} from './../../datasources/db.datasource';
import {ObjectNodeRepository} from './../../repositories/object-node.repository';
import {CONTENT_GENERIC_TEMPLATE} from './content-generic-template.const';

@model()
export class GenericTemplate extends Entity {
  @property({
    type: 'string',
  })
  template: string;
  @property({
    type: 'string',
  })
  scss: string;
  @property({
    type: 'string',
  })
  controller: string;
}

@model({settings: {strict: false}})
export class ContentGenericTemplate extends ContentExtension<GenericTemplate> {}

export type ContentGenericTemplateRelations = ContentExtensionRelations;

export type ContentGenericTemplateWithRelations = ContentExtensionWithRelations<
  GenericTemplate
>;

export class ContentGenericTemplateRepository extends ContentExtensionRepository<
  GenericTemplate,
  typeof ContentGenericTemplate.prototype.id
> {
  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
  ) {
    super(ContentGenericTemplate, dataSource, objectNodeRepositoryGetter);
  }
}

export class ContentGenericTemplateService extends ContentExtensionService<
  GenericTemplate,
  typeof ContentGenericTemplate.prototype.id
> {
  constructor(
    @service(ContentEntityService)
    protected contentEntityService: ContentEntityService,
    @repository(ContentGenericTemplateRepository)
    protected contentExtensionRepository: ContentGenericTemplateRepository,
  ) {
    super(
      contentEntityService,
      contentExtensionRepository,
      CONTENT_GENERIC_TEMPLATE,
    );
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentGenericTemplate: {
          type: 'object',
          title: 'Layout definition',
          properties: {
            template: {
              type: 'string',
              title: 'Template',
              default: '',
              required: true,
              'x-schema-form': {
                type: 'textarea',
              },
            },
            scss: {
              type: 'string',
              title: 'Scss',
              default: '',
              'x-schema-form': {
                type: 'textarea',
              },
            },
            controller: {
              type: 'string',
              title: 'Controller',
              default: '',
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
