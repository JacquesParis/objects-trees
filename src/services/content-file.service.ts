/* eslint-disable @typescript-eslint/no-explicit-any */
import {bind, BindingScope, inject, service} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import fs from 'fs';
import path from 'path';
import {STORAGE_DIRECTORY} from './../constants';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent,
} from './content-entity.service';
import {MemoryFile} from './file-upload.service';

@bind({scope: BindingScope.SINGLETON})
export class ContentFileService implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
    @inject(STORAGE_DIRECTORY) private storageDirectory: string,
  ) {
    this.contentEntityService.registerNewContentType('ContentFile', this);
  }
  public async manageContent(
    entity: EntityWithContent,
    loadedFiles: MemoryFile[],
    fieldName = 'contentFile',
  ): Promise<boolean> {
    const contentFiles = loadedFiles?.filter(
      file => fieldName === file.fieldname,
    );
    if (!contentFiles || contentFiles.length === 0) {
      return false;
    }
    if (1 < contentFiles.length) {
      throw new HttpErrors.BadRequest(
        fieldName + 'field must contain only one file',
      );
    }

    const dirPath = path.join(
      this.storageDirectory,
      './' + entity.entityName + '/' + entity.id,
    );
    await fs.promises.mkdir(dirPath, {recursive: true});

    const filePath = path.join(dirPath, './' + fieldName);
    await fs.promises.writeFile(filePath, contentFiles[0].buffer);

    console.log(dirPath, filePath);

    entity.content = {
      filename: loadedFiles[0].originalname,
      id: loadedFiles[0].originalname,
    };

    return true;
  }
}
