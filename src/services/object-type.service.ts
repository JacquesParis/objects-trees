import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {
  DataObject,
  FilterExcludingWhere,
  Options,
  repository,
} from '@loopback/repository';
import _ from 'lodash';
import {ObjectSubType} from '../models';
import {ObjectTypeRepository} from '../repositories';
import {ApplicationError} from './../helper/application-error';
import {ObjectType, ObjectTypeRelations} from './../models/object-type.model';
import {ObjectSubTypeRepository} from './../repositories/object-sub-type.repository';
import {ApplicationService, CurrentContext} from './application.service';
import {ContentEntityService} from './content-entity.service';

const defaultObjectTypeFilter = {
  order: ['name'],
  fields: {
    definition: true,
    id: true,
    name: true,
    contentType: true,
    uri: true,
  },
  include: [
    {
      relation: 'objectSubTypes',
      scope: {
        order: ['index'],
      },
    },
  ],
};

@bind({scope: BindingScope.SINGLETON})
export class ObjectTypeService {
  constructor(
    @repository(ObjectTypeRepository)
    private objectTypeRepository: ObjectTypeRepository,
    @repository(ObjectSubTypeRepository)
    private objectSubTypeRepository: ObjectSubTypeRepository,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(ApplicationService) private appCtx: ApplicationService,
  ) {}

  async add(
    objectType: DataObject<ObjectType>,
    ctx: CurrentContext,
  ): Promise<ObjectType> {
    delete objectType.contentDefinition;

    const newType = await this.objectTypeRepository.create(objectType);

    return newType;
  }

  async searchByName(name: string): Promise<ObjectType> {
    const objectTypes: ObjectType[] = await this.objectTypeRepository.find({
      where: {name: name},
    });
    if (1 < objectTypes.length) {
      throw ApplicationError.tooMany({objectType: name});
    }
    if (!!objectTypes && 0 < objectTypes.length) {
      const objectType = objectTypes[0];
      if (objectType) {
        objectType.contentDefinition = await this.contentEntityService.getContentDefinition(
          objectType.contentType,
        );
      }
      return objectType;
    }
    return (null as unknown) as ObjectType;
  }
  private get filterOrder() {
    return _.cloneDeep(defaultObjectTypeFilter.order);
  }

  private get filterFields() {
    return _.cloneDeep(defaultObjectTypeFilter.fields);
  }
  private get filterInclude() {
    return _.cloneDeep(defaultObjectTypeFilter.include);
  }

  public async searchById(
    id: string,
    filter?: FilterExcludingWhere<ObjectType>,
    options?: Options,
  ): Promise<ObjectType & ObjectTypeRelations> {
    if (!filter) {
      filter = {};
    }
    if (!filter.fields) {
      filter.fields = this.filterFields;
    }
    filter.include = this.filterInclude;
    const objectType = await this.objectTypeRepository.findById(
      id,
      filter,
      options,
    );
    if (objectType) {
      objectType.contentDefinition = await this.contentEntityService.getContentDefinition(
        objectType.contentType,
      );
    }
    return objectType;
  }

  public async search(
    ctx: CurrentContext,
  ): Promise<(ObjectType & ObjectTypeRelations)[]> {
    const filter = {
      order: this.filterOrder,
      fields: this.filterFields,
      include: this.filterInclude,
    };
    const objectTypes = await this.objectTypeRepository.find(filter);
    for (const objectType of objectTypes) {
      objectType.contentDefinition = await this.contentEntityService.getContentDefinition(
        objectType.contentType,
      );
    }
    return objectTypes;
  }

  public async getAll(
    ctx: CurrentContext,
  ): Promise<{[id: string]: ObjectType}> {
    return ctx.typeContext.types.getOrSetValue(async () => {
      return _.mapKeys(
        await this.objectTypeRepository.find(),
        (objectType: ObjectType, index) => {
          return objectType.id;
        },
      );
    });
  }

  removeById(id: string, ctx: CurrentContext): Promise<void> {
    return this.objectTypeRepository.deleteById(id);
  }

  async modifyById(
    id: string,
    objectType: DataObject<ObjectType>,
    ctx: CurrentContext,
  ): Promise<ObjectType> {
    delete objectType.contentDefinition;
    await this.objectTypeRepository.updateById(id, objectType);
    return this.objectTypeRepository.findById(id);
  }

  public async createSubType(
    id: string,
    objectSubType: DataObject<ObjectSubType>,
  ): Promise<ObjectSubType> {
    return this.objectTypeRepository.objectSubTypes(id).create(objectSubType);
  }

  public async modifySubTypeById(
    objectTypeId: string,
    id: string,
    objectSubType: DataObject<ObjectSubType>,
  ): Promise<ObjectSubType> {
    const where = {
      id: id,
    };
    await this.objectTypeRepository
      .objectSubTypes(objectTypeId)
      .patch(objectSubType, where);
    return this.objectSubTypeRepository.findById(id);
  }

  public async removeSubTypeById(objectTypeId: string, id: string) {
    const where = {
      id: id,
    };
    return this.objectTypeRepository.objectSubTypes(objectTypeId).delete(where);
  }

  public async getOrCreateObjectSubType(
    objectTypeId: string,
    subObjectTypeId: string,
    defaultValue?: {
      name: string;
      acl: boolean;
      owner: boolean;
      namespace: boolean;
      tree: boolean;
      min?: number;
      max?: number;
      exclusions?: string[];
      mandatories?: string[];
    },
  ): Promise<ObjectSubType> {
    const where = {
      subObjectTypeId: subObjectTypeId,
    };
    const subTypes = await this.objectTypeRepository
      .objectSubTypes(objectTypeId)
      .find({where});
    if (!subTypes || 0 === subTypes.length) {
      if (!defaultValue) {
        return (null as unknown) as ObjectSubType;
      }
      return this.createSubType(
        objectTypeId,
        _.merge({}, defaultValue, {subObjectTypeId}),
      );
    }
    if (1 < subTypes.length) {
      throw ApplicationError.tooMany({
        objectType: objectTypeId,
        subObjectType: subObjectTypeId,
      });
    }
    return subTypes[0];
  }
  /*
   * Add service methods here
   */
}
