/* eslint-disable @typescript-eslint/no-explicit-any */
import {IJsonSchema} from '@jacquesparis/objects-model';
import {Getter, inject, service} from '@loopback/core';
import {
  DataObject,
  Entity,
  FilterExcludingWhere,
  model,
  Options,
  property,
  repository,
} from '@loopback/repository';
import {clone} from 'lodash';
import SimpleCrypto from 'simple-crypto-js';
import {DATASTORE_DB} from '../../constants';
import {DbDataSource} from '../../datasources/db.datasource';
import {
  ContentExtension,
  ContentExtensionRelations,
  ContentExtensionRepository,
  ContentExtensionService,
  ContentExtensionWithRelations,
} from '../../integration/content-extension.definition';
import {ObjectNodeRepository} from '../../repositories/object-node.repository';
import {ContentEntityService} from '../../services/content-entity/content-entity.service';
import {ApplicationService} from './../../services/application.service';
import {
  CONTENT_ENCRYPTED_OBJECT,
  CONTENT_ENCRYPTED_OBJECT_PROVIDER,
} from './content-encrypted-object.const';

@model()
export class EncryptedObject extends Entity {
  @property({
    required: false,
  })
  value: any;
}

@model({settings: {strict: false}})
export class ContentEncryptedObject extends ContentExtension<EncryptedObject> {}

export type ContentEncryptedObjectRelations = ContentExtensionRelations;

export type ContentEncryptedObjectWithRelations = ContentExtensionWithRelations<EncryptedObject>;

export class ContentEncryptedObjectRepository extends ContentExtensionRepository<
  EncryptedObject,
  typeof ContentEncryptedObject.prototype.id
> {
  private simpleCrypto: SimpleCrypto;
  constructor(
    @inject(DATASTORE_DB) dataSource: DbDataSource,
    @repository.getter('ObjectNodeRepository')
    protected objectNodeRepositoryGetter: Getter<ObjectNodeRepository>,
    @service(ApplicationService) private appCtx: ApplicationService,
  ) {
    super(ContentEncryptedObject, dataSource, objectNodeRepositoryGetter);
    this.simpleCrypto = new SimpleCrypto(appCtx.config.serverSecretKey);
  }
  async create(
    entity: DataObject<ContentExtension<EncryptedObject>>,
    options?: Options,
  ): Promise<ContentExtension<EncryptedObject>> {
    return this.decrypt(await super.create(this.encrypt(entity), options));
  }

  private encrypt(
    content: DataObject<ContentExtension<EncryptedObject>>,
  ): DataObject<ContentExtension<EncryptedObject>> {
    const result = clone(content);
    if (result.content?.value) {
      result.content.value = this.simpleCrypto.encrypt(result.content.value);
    }
    return result;
  }
  private decrypt<T extends ContentExtension<EncryptedObject>>(content: T): T {
    const result = clone(content);
    result.content.value = this.simpleCrypto.decrypt(result.content.value);
    return result;
  }
  async updateById(
    id: string | undefined,
    data: DataObject<ContentExtension<EncryptedObject>>,
    options?: Options,
  ): Promise<void> {
    return super.updateById(id, this.encrypt(data), options);
  }

  async findById(
    id: string | undefined,
    filter?: FilterExcludingWhere<ContentExtension<EncryptedObject>>,
    options?: Options,
  ): Promise<
    ContentExtension<EncryptedObject> & ContentEncryptedObjectRelations
  > {
    return this.decrypt(await super.findById(id, filter, options));
  }
}

export class ContentEncryptedObjectService extends ContentExtensionService<
  EncryptedObject,
  typeof ContentEncryptedObject.prototype.id
> {
  constructor(
    @service(ContentEntityService)
    protected contentEntityService: ContentEntityService,
    @repository(ContentEncryptedObjectRepository)
    protected contentExtensionRepository: ContentEncryptedObjectRepository,
  ) {
    super(
      CONTENT_ENCRYPTED_OBJECT_PROVIDER,
      ContentEncryptedObjectService.name,
      contentEntityService,
      contentExtensionRepository,
      CONTENT_ENCRYPTED_OBJECT,
    );
  }

  public async getContentDefinition(): Promise<IJsonSchema> {
    return {
      properties: {
        contentEncryptedObject: {
          type: 'object',
          title: 'Encrypted object',
          properties: {
            value: {
              type: 'object',
              title: 'Encrypted value',
              default: '',
              'x-schema-form': {
                type: 'json',
              },
            },
          },
        },
      },
    };
  }
}
