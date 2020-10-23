/* eslint-disable @typescript-eslint/no-explicit-any */
import {bind, /*inject, */ BindingScope} from '@loopback/core';
import {Entity} from '@loopback/repository';
import {MemoryFile} from './file-upload.service';

export interface EntityWithContent {
  id?: string;
  content?: any;
  entityName?: string;
}

export interface ContentEntityServiceInterface {
  manageContent(
    entity: EntityWithContent,
    loadedFiles: MemoryFile[],
  ): Promise<boolean>;
}

@bind({scope: BindingScope.SINGLETON})
export class ContentEntityService {
  public hasContentManager(contentType: string) {
    return contentType && contentType in this.contentTypes;
  }
  protected contentTypes: {
    [contentType: string]: ContentEntityServiceInterface;
  } = {};
  constructor(/* Add @inject to inject parameters */) {}

  public registerNewContentType(
    contentType: string,
    service: ContentEntityServiceInterface,
  ) {
    this.contentTypes[contentType] = service;
  }

  public manageContent(
    contentType: string,
    entity: Entity,
    loadedFiles?: MemoryFile[],
  ): Promise<boolean> {
    if (this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].manageContent(
        entity as EntityWithContent,
        loadedFiles ? loadedFiles : [],
      );
    }
    return Promise.resolve(false);
  }
}
