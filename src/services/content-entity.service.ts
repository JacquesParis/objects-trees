import {IJsonSchema} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {bind, /*inject, */ BindingScope} from '@loopback/core';
import {Entity} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

export interface EntityWithContent {
  id?: string;
  content?: any;
  entityName?: string;
  [contentFieldName: string]: any;
}

export interface ContentEntityServiceInterface {
  getContentDefinition(): Promise<IJsonSchema>;
  getContent(
    entity: EntityWithContent,
    fieldName: string,
    args: {contentId?: string},
  ): Promise<
    | {
        filePath: string;
        fileName: string;
      }
    | any
  >;
  manageContent(
    entity: EntityWithContent,
    postedEntity: EntityWithContent,
  ): Promise<boolean>;
  addTransientContent(entity: EntityWithContent): Promise<void>;
}

@bind({scope: BindingScope.SINGLETON})
export class ContentEntityService {
  async getContentDefinition(
    contentType: string | undefined,
  ): Promise<IJsonSchema> {
    if (this.hasContentManager(contentType)) {
      return this.contentTypes[contentType as string].getContentDefinition();
    }
    return {properties: {}};
  }
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
    postedEntity: Entity,
  ): Promise<boolean> {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].manageContent(
        entity as EntityWithContent,
        postedEntity as EntityWithContent,
      );
    }
    return Promise.resolve(false);
  }

  public addTransientContent(
    contentType: string | undefined,
    entity: Entity,
  ): Promise<void> {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].addTransientContent(
        entity as EntityWithContent,
      );
    }
    return Promise.resolve();
  }

  public getContent(
    contentType: string | undefined,
    entity: Entity,
    fieldName: string,
    args: {contentId?: string},
  ): any {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].getContent(
        entity as EntityWithContent,
        fieldName,
        args,
      );
    }
    throw new HttpErrors.NotImplemented(
      'No content ' + contentType + ' to load',
    );
  }
}
