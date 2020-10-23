/* eslint-disable @typescript-eslint/no-explicit-any */
import {bind, /*inject, */ BindingScope} from '@loopback/core';
import {Entity} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {MemoryFile} from './file-upload.service';

export interface EntityWithContent {
  id?: string;
  content?: any;
  entityName?: string;
}

export interface ContentEntityServiceInterface {
  getContent(entity: EntityWithContent, fieldName:string, args: {filename?: string | undefined;}):Promise<{
    filePath: string;
    fileName: string;
  }|any>;
  manageContent(
    entity: EntityWithContent,
    loadedFiles: MemoryFile[],
  ): Promise<boolean>;
}

@bind({scope: BindingScope.SINGLETON})
export class ContentEntityService {
  public hasContentManager(contentType: string | undefined) {
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
    contentType: string | undefined,
    entity: Entity,
    loadedFiles?: MemoryFile[],
  ): Promise<boolean> {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].manageContent(
        entity as EntityWithContent,
        loadedFiles ? loadedFiles : [],
      );
    }
    return Promise.resolve(false);
  }

 public getContent(
  contentType: string | undefined,
  entity: Entity, fieldName:string, args: {[key:string]:any;}): any {

  if (contentType && this.hasContentManager(contentType)) {
    return this.contentTypes[contentType].getContent(
      entity as EntityWithContent, fieldName,
      args,
    );
  }
  throw new HttpErrors.NotImplemented('No content '+contentType+' to load');
  }
}
