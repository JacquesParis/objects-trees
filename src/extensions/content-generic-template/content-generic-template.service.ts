import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from '../../services/content-entity/content-entity.service';
import {CONTENT_GENERIC_TEMPLATE} from './content-generic-template.const';
import {GenericTemplate} from './content-generic-template.model';
import {ContentGenericTemplateRepository} from './content-generic-template.repository';

export class ContentGenericTemplateService
  implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @repository(ContentGenericTemplateRepository)
    protected contentGenericTemplateRepository: ContentGenericTemplateRepository,
  ) {
    this.contentEntityService.registerNewContentType(
      CONTENT_GENERIC_TEMPLATE,
      this,
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

  public async deleteContents(
    entities: EntityWithContent[],
    fieldName = 'contentGenericTemplate',
  ): Promise<void> {
    const contentIdsToDelete: string[] = entities
      .filter((entity) => {
        return entity[fieldName + 'Id'];
      })
      .map((entity) => entity[fieldName + 'Id']);
    await this.contentGenericTemplateRepository.deleteAll({
      id: {inq: contentIdsToDelete},
    });
  }

  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = 'contentGenericTemplate',
  ): Promise<boolean> {
    const postedGenericTemplateId = entity[fieldName + 'Id'];
    const postedGenericTemplate = postedEntity[fieldName];
    if (undefined === postedGenericTemplate) {
      return false;
    }
    if (null === postedGenericTemplate || '' === postedGenericTemplate) {
      if (postedGenericTemplateId) {
        await this.contentGenericTemplateRepository.deleteById(
          postedGenericTemplateId,
        );
        entity[fieldName + 'Id'] = null;
        return true;
      }
      return false;
    } else {
      if (postedGenericTemplateId) {
        await this.contentGenericTemplateRepository.updateById(
          postedGenericTemplateId,
          {
            content: postedGenericTemplate,
          },
        );
        return false;
      } else {
        const newGenericTemplate = await this.contentGenericTemplateRepository.create(
          {
            content: postedGenericTemplate,
            objectNodeId: entity.id,
          },
        );
        entity[fieldName + 'Id'] = newGenericTemplate.id;
        return true;
      }
    }
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName = 'contentGenericTemplate',
    args: {contentId: string},
  ): Promise<GenericTemplate> {
    const contentGenericTemplate = await this.contentGenericTemplateRepository.findById(
      args.contentId,
    );
    return contentGenericTemplate.content;
  }

  public async addTransientContent(
    entity: EntityWithContent,
    fieldName = 'contentGenericTemplate',
  ): Promise<void> {
    if (entity[fieldName + 'Id']) {
      entity[fieldName] = await this.getContent(entity, fieldName, {
        contentId: entity[fieldName + 'Id'],
      });
    }
  }
}
