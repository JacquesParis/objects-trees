/* eslint-disable @typescript-eslint/no-explicit-any */
import {IEntityContext, IJsonSchema} from '@jacquesparis/objects-model';
import {Entity} from '@loopback/repository';
import {ApplicationError} from '../../helper/application-error';
import {TreatmentDescription} from './../../integration/extension-description';
import {EntityName} from './../../models/entity-name';

export interface EntityWithContent {
  id?: string;
  content?: any;
  entityName?: string;
  entityCtx?: IEntityContext;
  [contentFieldName: string]: any;
}

export interface ContentEntityServiceInterface {
  providerId: string;
  serviceId: string;
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
  deleteContents(entities: EntityWithContent[]): Promise<void>;
}

export class ContentEntityService {
  async getContentDefinition(
    contentType: string | undefined,
  ): Promise<IJsonSchema> {
    if (this.hasContentManager(contentType)) {
      return this.contentTypeDefinitions[
        contentType as string
      ].getContentDefinition();
    }
    return {properties: {}};
  }
  public hasContentManager(contentType: string | undefined) {
    return contentType && contentType in this.contentTypeDefinitions;
  }
  protected contentTypeDefinitions: {
    [contentType: string]: ContentEntityServiceInterface;
  } = {};
  constructor(/* Add @inject to inject parameters */) {}

  getPostTraitmentDescription(): TreatmentDescription[] {
    const treatment: TreatmentDescription[] = [];
    for (const contentType of Object.keys(this.contentTypeDefinitions)) {
      treatment.push(
        new TreatmentDescription(
          this.contentTypeDefinitions[contentType].providerId,
          this.contentTypeDefinitions[contentType].serviceId,
          contentType + ': Add transient fields',
        ),
      );
    }
    return treatment;
  }
  public registerNewContentType(
    contentType: string,
    service: ContentEntityServiceInterface,
  ) {
    this.contentTypeDefinitions[contentType] = service;
  }

  public get contentTypes(): string[] {
    return Object.keys(this.contentTypeDefinitions);
  }

  public manageContent(
    contentType: string | undefined,
    entity: Entity,
    postedEntity: Entity,
  ): Promise<boolean> {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypeDefinitions[contentType].manageContent(
        entity as EntityWithContent,
        postedEntity as EntityWithContent,
      );
    }
    return Promise.resolve(false);
  }

  public async deleteContents(contentType: string, entities: Entity[]) {
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypeDefinitions[contentType].deleteContents(entities);
    }
  }

  public addTransientContent(
    entityType: EntityName,
    contentType: string | undefined,
    entity: EntityWithContent,
  ): Promise<void> {
    if (!entity.entityCtx) {
      entity.entityCtx = {entityType: entityType};
    }
    if (contentType && this.hasContentManager(contentType)) {
      return this.contentTypeDefinitions[contentType].addTransientContent(
        entity,
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
      return this.contentTypeDefinitions[contentType].getContent(
        entity as EntityWithContent,
        fieldName,
        args,
      );
    }
    throw ApplicationError.notFound({contentType: contentType});
  }
}
