import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {Entity, model, property, repository} from '@loopback/repository';
import {
  ContentExtension,
  ContentExtensionRelations,
  ContentExtensionRepository,
  ContentExtensionService,
  ContentExtensionWithRelations,
} from '../../integration/content-extension.definition';
import {ContentEntityService} from '../../services/content-entity/content-entity.service';
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
}

@model({settings: {strict: false}})
export class ContentGenericTemplate extends ContentExtension<GenericTemplate> {}

export type ContentGenericTemplateRelations = ContentExtensionRelations;

export type ContentGenericTemplateWithRelations = ContentExtensionWithRelations<
  GenericTemplate
>;

export class ContentGenericTemplateRepository extends ContentExtensionRepository<
  GenericTemplate
> {}

export class ContentGenericTemplateService extends ContentExtensionService<
  GenericTemplate
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
          },
        },
      },
    };
  }
}
