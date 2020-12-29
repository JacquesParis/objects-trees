import {IJsonSchema} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ContentTextRepository} from './../../repositories/content-text.repository';
import {CONTENT_ENTITY_PROVIDER} from './content-entity.const';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from './content-entity.service';

export class ContentTextService implements ContentEntityServiceInterface {
  public providerId: string = CONTENT_ENTITY_PROVIDER;
  public serviceId: string = ContentTextService.name;
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @repository(ContentTextRepository)
    public contentTextRepository: ContentTextRepository,
  ) {
    this.contentEntityService.registerNewContentType('ContentText', this);
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentText: {
          type: 'string',
          'x-schema-form': {
            type: 'textarea',
          },
        },
      },
    };
  }

  public async deleteContents(
    entities: EntityWithContent[],
    fieldName = 'contentText',
  ): Promise<void> {
    const contentIdsToDelete: string[] = entities
      .filter((entity) => {
        return entity[fieldName + 'Id'];
      })
      .map((entity) => entity[fieldName + 'Id']);
    await this.contentTextRepository.deleteAll({id: {inq: contentIdsToDelete}});
  }

  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = 'contentText',
  ): Promise<boolean> {
    const postedTextId = entity[fieldName + 'Id'];
    const postedText = postedEntity[fieldName];
    if (undefined === postedText) {
      return false;
    }
    if (null === postedText || '' === postedText) {
      if (postedTextId) {
        await this.contentTextRepository.deleteById(postedTextId);
        entity[fieldName + 'Id'] = null;
        return true;
      }
      return false;
    } else {
      if (postedTextId) {
        await this.contentTextRepository.updateById(postedTextId, {
          text: postedText,
        });
        return false;
      } else {
        const newText = await this.contentTextRepository.create({
          text: postedText,
          objectNodeId: entity.id,
        });
        entity[fieldName + 'Id'] = newText.id;
        return true;
      }
    }
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName = 'contentText',
    args: {contentId: string},
  ): Promise<string> {
    const text = await this.contentTextRepository.findById(args.contentId);
    return text.text as string;
  }

  public async addTransientContent(
    entity: EntityWithContent,
    fieldName = 'contentText',
  ): Promise<void> {
    if (entity[fieldName + 'Id']) {
      entity[fieldName] = await this.getContent(entity, fieldName, {
        contentId: entity[fieldName + 'Id'],
      });
    }
  }
}
