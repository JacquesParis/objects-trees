/* eslint-disable @typescript-eslint/no-explicit-any */
import {IJsonSchema} from '@jacquesparis/objects-model';
import {Entity} from '@loopback/repository';
import {ApplicationError} from '../../helper/application-error';

export interface EntityWithContent {
  id?: string;
  content?: any;
  entityName?: string;
  entityCtx?: {jsonSchema?: IJsonSchema};
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
    entity: EntityWithContent,
  ): Promise<void> {
    if (!entity.entityCtx) {
      entity.entityCtx = {};
    }
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypes[contentType].addTransientContent(entity);
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
    throw ApplicationError.notFound({contentType: contentType});
  }
}
