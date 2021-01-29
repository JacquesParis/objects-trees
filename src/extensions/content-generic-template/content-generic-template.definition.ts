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
import {
  CONTENT_GENERIC_PROVIDER,
  CONTENT_GENERIC_TEMPLATE,
} from './content-generic-template.const';

@model()
export class GenericTemplate extends Entity {
  @property({
    type: 'string',
  })
  templateMustache: string;
  @property({
    type: 'string',
  })
  headerScript: string;
  @property({
    type: 'string',
  })
  footerScript: string;

  @property({type: 'array', default: [], itemType: 'string'})
  templatesMustache: string[];

  @property({
    type: 'string',
  })
  templateAngular: string;
  @property({
    type: 'string',
  })
  scss: string;
  @property({
    type: 'string',
  })
  css: string;
  @property({
    type: 'string',
  })
  controller: string; /*
  @property({
    required: false,
  })
  config: IJsonSchema;*/
  @property({
    required: false,
  })
  refererConfig: IJsonSchema;
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
      CONTENT_GENERIC_PROVIDER,
      ContentGenericTemplateService.name,
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
            templateMustache: {
              type: 'string',
              title: 'Template Mustache',
              default: '',
              required: true,
              'x-schema-form': {
                type: 'textarea',
              },
            },
            headerScript: {
              type: 'string',
              title: 'Script javascript ajouté au header',
              default: '',
              required: true,
              'x-schema-form': {
                type: 'textarea',
              },
            },
            footerScript: {
              type: 'string',
              title: 'Script javascript ajouté en bas de page',
              default: '',
              required: true,
              'x-schema-form': {
                type: 'textarea',
              },
            },
            templatesMustache: {
              type: 'array',
              title: 'Recursive template Mustache',
              default: [],
              required: false,
              items: {
                type: 'string',
              },
            },
            css: {
              type: 'string',
              title: 'Mustache css',
              default: '',
              'x-schema-form': {
                type: 'textarea',
              },
            },
            templateAngular: {
              type: 'string',
              title: 'Template Angular',
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
            /*
            config: {
              type: 'object',
              title: 'Template configuration definition',
              default: '',
              'x-schema-form': {
                type: 'json',
              },
            },*/
            refererConfig: {
              type: 'object',
              title: 'Referer configuration definition',
              default: '',
              'x-schema-form': {
                type: 'json',
              },
            },
          },
        },
      },
    };
  }
}
