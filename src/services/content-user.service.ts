import {IJsonSchema} from '@jacquesparis/objects-model';
import {UserRepository} from '@loopback/authentication-jwt';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ApplicationService} from './application.service';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from './content-entity.service';

const FIELD_NAME = 'contentUser';

export class ContentUserService implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {
    this.contentEntityService.registerNewContentType(
      ApplicationService.CONTENT_TYPE.USER,
      this,
    );
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentUser: {
          type: 'string',
          title: 'User email',
        },
      },
    };
  }

  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = FIELD_NAME,
  ): Promise<boolean> {
    const postedUserId = entity[fieldName + 'Id'];
    const postedUser = postedEntity[fieldName];
    if (undefined === postedUser) {
      return false;
    }
    if (null === postedUser || '' === postedUser) {
      if (postedUserId) {
        entity[fieldName + 'Id'] = null;
        return true;
      }
      return false;
    } else {
      let user = await this.userRepository.findOne({
        where: {email: postedUser},
      });
      if (!user) {
        user = await this.userRepository.create({email: postedUser});
      }
      entity[fieldName + 'Id'] = user.id;
      return true;
    }
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName = FIELD_NAME,
    args: {contentId: string},
  ): Promise<string> {
    const user = await this.userRepository.findById(args.contentId);
    return user.email as string;
  }

  public async addTransientContent(
    entity: EntityWithContent,
    fieldName = FIELD_NAME,
  ): Promise<void> {
    if (entity[fieldName + 'Id']) {
      entity[fieldName] = await this.getContent(entity, fieldName, {
        contentId: entity[fieldName + 'Id'],
      });
    }
  }
}
