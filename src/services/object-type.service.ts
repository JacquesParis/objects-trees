import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {DataObject, repository} from '@loopback/repository';
import _, {indexOf, isArray, omitBy, uniq} from 'lodash';
import {toStartCase} from '../helper';
import {ObjectSubType} from '../models';
import {ObjectTypeRepository} from '../repositories';
import {ApplicationError} from './../helper/application-error';
import {EntityName} from './../models/entity-name';
import {ObjectType, ObjectTypeRelations} from './../models/object-type.model';
import {ObjectSubTypeRepository} from './../repositories/object-sub-type.repository';
import {ApplicationService, CurrentContext} from './application.service';
import {ContentEntityService} from './content-entity/content-entity.service';

const defaultObjectTypeFilter = {
  order: ['name'],
  fields: {
    definition: true,
    inheritedTypesIds: true,
    id: true,
    name: true,
    title: true,
    contentType: true,
    uri: true,
    iconView: true,
    templateView: true,
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
    objectType: DataObject<ObjectType> & {name: string},
    ctx: CurrentContext,
  ): Promise<ObjectType> {
    delete objectType.contentDefinition;
    objectType.id = objectType.name;
    objectType.applicationType = !!objectType.applicationType;

    const newType = await this.objectTypeRepository.create(objectType);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.resetCache();
    if (!objectType.applicationType) {
      return this.searchByName(objectType.name);
    }

    return newType;
  }

  public async getTypeWithContent(
    ctx: CurrentContext,
  ): Promise<{[id: string]: ObjectType}> {
    const types = await this.getAll(ctx);

    return omitBy(types, (type) => {
      return !type.contentType || '' === type.contentType;
    });
  }

  async cleanWhenReboot() {
    const types = await this.objectTypeRepository.find({
      where: {applicationType: true},
    });

    for (const type of types) {
      await this.objectSubTypeRepository.deleteAll({
        or: [{objectTypeId: type.id}, {subObjectTypeId: type.id}],
      });
      await this.objectTypeRepository.delete(type);
    }
  }

  async registerApplicationType(
    objectType: DataObject<ObjectType> & {name: string},
  ) {
    objectType.applicationType = true;
    return this.add(objectType, new CurrentContext());
  }

  async searchByName(name: string): Promise<ObjectType> {
    return this.searchById(name);
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
  ): Promise<ObjectType & ObjectTypeRelations> {
    return (await this.searchAll())[id];
  }

  public async getImplementedTypes(type: string): Promise<string[]> {
    const implementedTypes: {
      [type: string]: string[];
    } = await this.appCtx.implementedTypes.getOrSetValue(async () => {
      const result: {
        [type: string]: string[];
      } = {};
      const allTypes = await this.searchAll();
      for (const knownType in allTypes) {
        result[knownType] = [];
        const objectType = allTypes[knownType];
        if (objectType?.entityCtx?.implementedTypes) {
          result[knownType].push(...objectType.entityCtx.implementedTypes);
        }
      }
      return result;
    });

    return type in implementedTypes ? implementedTypes[type] : [];
  }

  public async getImplementingCommonTypes(type: string): Promise<string[]> {
    const implementingCommonTypes: {
      [type: string]: string[];
    } = await this.appCtx.implementingCommonTypes.getOrSetValue(async () => {
      const types: {[type: string]: string[]} = {};
      const allTypes = await this.searchAll();
      for (const knownType in allTypes) {
        types[knownType] = [];
        for (const implementedType of await this.getImplementedTypes(
          knownType,
        )) {
          for (const implementingType of await this.getImplementingTypes(
            implementedType,
          )) {
            if (-1 === indexOf(types[knownType], implementingType)) {
              types[knownType].push(implementingType);
            }
          }
        }
      }
      return types;
    });
    return type in implementingCommonTypes ? implementingCommonTypes[type] : [];
  }

  public async getImplementingTypes(type: string): Promise<string[]> {
    const implementingTypes: {
      [type: string]: string[];
    } = await this.appCtx.implementingTypes.getOrSetValue(async () => {
      const result: {
        [type: string]: string[];
      } = {};
      const allTypes = await this.searchAll();
      for (const knownType in allTypes) {
        result[knownType] = [];
        for (const subType in allTypes) {
          if (
            -1 <
            indexOf(allTypes[subType]?.entityCtx?.implementedTypes, knownType)
          ) {
            result[knownType].push(subType);
          }
        }
      }
      return result;
    });

    return type in implementingTypes ? implementingTypes[type] : [];
  }

  public async getParentTypesOfType(type: string) {
    const parentTypes: {
      [type: string]: string[];
    } = await this.appCtx.parentTypes.getOrSetValue(async () => {
      const result: {
        [type: string]: string[];
      } = {};
      const allTypes = await this.searchAll();
      for (const knownType in allTypes) {
        result[knownType] = [];
        for (const parentType in allTypes) {
          if (
            parentType in allTypes &&
            allTypes[parentType].objectSubTypes &&
            -1 <
              indexOf(
                allTypes[parentType].objectSubTypes.map(
                  (subType) => subType.subObjectTypeId,
                ),
                knownType,
              )
          ) {
            result[knownType].push(parentType);
          }
        }
      }
      return result;
    });

    return type in parentTypes ? parentTypes[type] : [];
  }

  public async getParentTypesOfImplementingType(type: string) {
    const parentImplementingTypes: {
      [type: string]: string[];
    } = await this.appCtx.parentImplementingTypes.getOrSetValue(async () => {
      const result: {
        [type: string]: string[];
      } = {};

      const allTypes = await this.searchAll();

      for (const knownType in allTypes) {
        result[knownType] = [];
        for (const implementingType of await this.getImplementingTypes(
          knownType,
        )) {
          result[knownType].push(
            ...(await this.getParentTypesOfType(implementingType)).filter(
              (parentType) => -1 === result[knownType].indexOf(parentType),
            ),
          );
        }
      }
      return result;
    });

    return type in parentImplementingTypes ? parentImplementingTypes[type] : [];
  }

  public async search(
    ctx: CurrentContext,
  ): Promise<(ObjectType & ObjectTypeRelations)[]> {
    return _.values(await this.searchAll());
  }

  protected extendsType(
    type: ObjectType,
    allTypes: {
      [name: string]: ObjectType;
    },
  ) {
    if (type.extended) {
      return;
    }
    const implementedTypes: string[] = [type.name];
    type.extended = true;
    if (isArray(type.inheritedTypesIds)) {
      let parentTypeDefinition: IJsonSchema = {properties: {}};
      for (const inheritedTypeName of type.inheritedTypesIds) {
        const parentType = allTypes[inheritedTypeName];
        if (!parentType) {
          console.error(
            type.name + ': missing ' + inheritedTypeName + ' inherited type',
          );
          throw ApplicationError.missing({
            type: type.name,
            inheritedType: inheritedTypeName,
          });
        }
        this.extendsType(parentType, allTypes);
        if (parentType.entityCtx?.implementedTypes) {
          implementedTypes.push(...parentType.entityCtx.implementedTypes);
        }
        if (!type.title || '' === type.title) {
          type.title = parentType.title;
        }
        if (!type.contentType || '' === type.contentType) {
          type.contentType = parentType.contentType;
        }
        parentTypeDefinition = _.merge(
          {},
          parentTypeDefinition,
          parentType.definition,
        );
        if (!type.iconView || '' === type.iconView) {
          type.iconView = parentType.iconView;
        }
        if (!type.templateView || '' === type.templateView) {
          type.templateView = parentType.templateView;
        }
        if (parentType.objectSubTypes) {
          for (const parentSubType of parentType.objectSubTypes) {
            if (
              !_.some(
                type.objectSubTypes,
                (subType) => subType.name === parentSubType.name,
              )
            ) {
              if (!type.objectSubTypes) {
                type.objectSubTypes = [];
              }
              type.objectSubTypes.push(parentSubType);
            }
          }
        }
      }

      if (!type.definition) {
        type.definition = parentTypeDefinition;
      } else {
        type.definition = _.merge({}, parentTypeDefinition, type.definition);
      }
    }
    if (!type.entityCtx) {
      type.entityCtx = {entityType: EntityName.objectType};
    }
    type.entityCtx.implementedTypes = uniq(implementedTypes);
  }

  public async searchAll(): Promise<{
    [name: string]: ObjectType & ObjectTypeRelations;
  }> {
    return this.appCtx.allTypes.getOrSetValue(async () => {
      const filter = {
        order: this.filterOrder,
        fields: this.filterFields,
        include: this.filterInclude,
      };
      const allTypes = _.mapKeys(
        await this.objectTypeRepository.find(filter),
        (objectType: ObjectType, index) => {
          return objectType.id;
        },
      );
      for (const objectTypeName in allTypes) {
        const objectType = allTypes[objectTypeName];
        this.extendsType(objectType, allTypes);
        objectType.contentDefinition = await this.contentEntityService.getContentDefinition(
          objectType.contentType,
        );
      }
      for (const objectTypeName in allTypes) {
        if (
          !allTypes[objectTypeName].title ||
          '' === allTypes[objectTypeName].title
        ) {
          allTypes[objectTypeName].title = toStartCase(
            allTypes[objectTypeName].name,
          );
        }
      }
      for (const objectTypeName in allTypes) {
        if (allTypes[objectTypeName].objectSubTypes) {
          for (const objectSubType of allTypes[objectTypeName].objectSubTypes) {
            if (!objectSubType.title || '' === objectSubType.title) {
              objectSubType.title =
                allTypes[objectSubType.subObjectTypeId].title;
            }
          }
        }
      }

      return allTypes as {
        [name: string]: ObjectType & ObjectTypeRelations;
      };
    });
  }

  public async getAll(
    ctx: CurrentContext,
  ): Promise<{[id: string]: ObjectType}> {
    return ctx.typeContext.types.getOrSetValue(async () => {
      return this.searchAll();
    });
  }

  private resetCache() {
    this.appCtx.allTypes.value = (undefined as unknown) as {
      [nameId: string]: ObjectType & ObjectTypeRelations;
    };
    this.appCtx.implementedTypes.value = (undefined as unknown) as {
      [type: string]: string[];
    };
    this.appCtx.implementingTypes.value = (undefined as unknown) as {
      [type: string]: string[];
    };
  }

  removeById(id: string, ctx: CurrentContext): Promise<void> {
    this.resetCache();
    return this.objectTypeRepository.deleteById(id);
  }

  async modifyById(
    id: string,
    objectType: DataObject<ObjectType>,
    ctx: CurrentContext,
  ): Promise<ObjectType> {
    this.resetCache();
    delete objectType.contentDefinition;
    await this.objectTypeRepository.updateById(id, objectType);
    return this.searchById(id);
  }

  public async createSubType(
    id: string,
    objectSubType: DataObject<ObjectSubType>,
  ): Promise<ObjectSubType> {
    this.resetCache();
    return this.objectTypeRepository.objectSubTypes(id).create(objectSubType);
  }

  public async modifySubTypeById(
    objectTypeId: string,
    id: string,
    objectSubType: DataObject<ObjectSubType>,
  ): Promise<ObjectSubType> {
    this.resetCache();
    const where = {
      id: id,
    };
    await this.objectTypeRepository
      .objectSubTypes(objectTypeId)
      .patch(objectSubType, where);
    return this.objectSubTypeRepository.findById(id);
  }

  public async removeSubTypeById(objectTypeId: string, id: string) {
    this.resetCache();
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
      title?: string;
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
    this.resetCache();
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
