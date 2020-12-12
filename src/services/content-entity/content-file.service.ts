/* eslint-disable no-empty */
import {IJsonSchema} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject, service} from '@loopback/core';
import fs from 'fs';
import path from 'path';
import {STORAGE_DIRECTORY} from './../../constants';
import {ApplicationError} from './../../helper/application-error';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from './content-entity.service';

export interface ContentFileEntity {
  base64?: string;
  size?: string;
  name?: string;
  type?: string;
  id?: string;
  uri?: string;
}

export class ContentFileService implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
  ) {
    this.contentEntityService.registerNewContentType('ContentFile', this);
  }
  protected getDirPath(entity: EntityWithContent): string {
    return path.join(
      this.storageDirectory,
      './' + entity.entityName + '/' + entity.id,
    );
  }
  protected getFilePath(entity: EntityWithContent, fieldName: string): string {
    return path.join(this.getDirPath(entity), './' + fieldName);
  }

  public async deleteContents(
    entities: EntityWithContent[],
    fieldName = 'contentFile',
  ): Promise<void> {
    const contentIdsToDelete: EntityWithContent[] = entities.filter(
      (entity) => {
        return entity[fieldName]?.id;
      },
    );
    for (const entity of contentIdsToDelete) {
      try {
        await fs.promises.unlink(this.getFilePath(entity, fieldName));
      } catch (error) {}
    }
  }
  public async manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
    fieldName = 'contentFile',
  ): Promise<boolean> {
    const contentFileEntity: ContentFileEntity = postedEntity[fieldName];
    if (
      !contentFileEntity ||
      !contentFileEntity.base64 ||
      !contentFileEntity.name
    ) {
      if (entity[fieldName]?.id && !contentFileEntity?.id) {
        try {
          await fs.promises.unlink(this.getFilePath(entity, fieldName));
        } catch (error) {}
        entity[fieldName] = {};

        return true;
      }
      return false;
    }

    const dirPath = this.getDirPath(entity);
    await fs.promises.mkdir(dirPath, {recursive: true});

    const filePath = this.getFilePath(entity, fieldName);
    await fs.promises.writeFile(
      filePath,
      Buffer.from(contentFileEntity.base64, 'base64'),
    );

    entity[fieldName] = {
      name: contentFileEntity.name,
      id: contentFileEntity.name,
      size: contentFileEntity.size,
      type: contentFileEntity.type,
    };

    return true;
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentFile: {
          type: 'file',
          title: 'Single file',
        },
      },
    };
  }

  addTransientContent(entity: EntityWithContent): Promise<void> {
    return Promise.resolve();
  }

  public async getContent(
    entity: EntityWithContent,
    fieldName: string,
    args: {contentId?: string},
  ): Promise<{
    filePath: string;
    fileName: string;
  }> {
    if (entity?.contentFile?.name !== args.contentId) {
      throw ApplicationError.notFound({file: args.contentId});
    }
    const dirPath = path.join(
      this.storageDirectory,
      './' + entity.entityName + '/' + entity.id,
    );
    return {
      filePath: path.join(dirPath, './' + fieldName),
      fileName: entity.contentFile.name,
    };
  }
}
