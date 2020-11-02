import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {
  DataObject,
  Filter,
  FilterExcludingWhere,
  Options,
  repository,
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import _ from 'lodash';
import {ObjectTypeRepository} from '../repositories';
import {ObjectType, ObjectTypeRelations} from './../models/object-type.model';
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
    public objectTypeRepository: ObjectTypeRepository,
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {}

  add(objectType: DataObject<ObjectType>): Promise<ObjectType> {
    delete objectType.contentDefinition;
    return this.objectTypeRepository.create(objectType);
  }

  async searchByName(name: string): Promise<ObjectType> {
    const objectTypes: ObjectType[] = await this.objectTypeRepository.find({
      where: {name: name},
    });
    if (1 < objectTypes.length) {
      throw new HttpErrors.PreconditionFailed('too many ' + name + ' type');
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
    filter?: Filter<ObjectType>,
    options?: Options,
  ): Promise<(ObjectType & ObjectTypeRelations)[]> {
    if (!filter) {
      filter = {};
    }
    if (!filter.order) {
      filter.order = this.filterOrder;
    }
    if (!filter.fields) {
      filter.fields = this.filterFields;
    }
    filter.include = this.filterInclude;
    const objectTypes = await this.objectTypeRepository.find(filter, options);
    for (const objectType of objectTypes) {
      objectType.contentDefinition = await this.contentEntityService.getContentDefinition(
        objectType.contentType,
      );
    }
    return objectTypes;
  }

  public async getAll(): Promise<{[id: string]: ObjectType}> {
    return _.mapKeys(
      await this.objectTypeRepository.find(),
      (objectType: ObjectType, index) => {
        return objectType.id;
      },
    );
  }

  removeById(id: string, options?: Options): Promise<void> {
    return this.objectTypeRepository.deleteById(id, options);
  }

  async modifyById(
    id: string,
    objectType: DataObject<ObjectType>,
    options?: Options,
  ): Promise<ObjectType> {
    delete objectType.contentDefinition;
    await this.objectTypeRepository.updateById(id, objectType, options);
    return this.objectTypeRepository.findById(id);
  }

  /*
   * Add service methods here
   */

  replaceById(id: string, objectType: ObjectType): Promise<void> {
    throw new HttpErrors.NotImplemented('Method not implemented.');
  }
  findById(
    id: string,
    filter:
      | Pick<
          Filter<ObjectType>,
          'fields' | 'order' | 'limit' | 'skip' | 'offset' | 'include'
        >
      | undefined,
  ): Promise<ObjectType & ObjectTypeRelations> {
    throw new HttpErrors.NotImplemented('Method not implemented.');
  }
  updateAll(
    objectType: ObjectType,
    where:
      | import('@loopback/repository').Condition<ObjectType>
      | import('@loopback/repository').AndClause<ObjectType>
      | import('@loopback/repository').OrClause<ObjectType>
      | undefined,
  ):
    | import('@loopback/repository').Count
    | PromiseLike<import('@loopback/repository').Count> {
    throw new HttpErrors.NotImplemented('Method not implemented.');
  }
  count(
    where:
      | import('@loopback/repository').Condition<ObjectType>
      | import('@loopback/repository').AndClause<ObjectType>
      | import('@loopback/repository').OrClause<ObjectType>
      | undefined,
  ):
    | import('@loopback/repository').Count
    | PromiseLike<import('@loopback/repository').Count> {
    throw new HttpErrors.NotImplemented('Method not implemented.');
  }
}
