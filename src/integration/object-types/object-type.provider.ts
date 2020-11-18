import {
  BindingFromClassOptions,
  Constructor,
  ControllerClass,
  Interceptor,
  InterceptorBindingOptions,
  Provider,
  ServiceOptions,
  ServiceOrProviderClass,
} from '@loopback/core';
import * as _ from 'lodash';
import {ObjectTreesApplicationInterface} from '../../application';
import {ObjectSubType} from '../../models';
import {ObjectType} from './../../models/object-type.model';
import {
  ApplicationExtensionContext,
  ApplicationService,
  CurrentContext,
  ExpectedValue,
} from './../../services/application.service';
import {ObjectTypeService} from './../../services/object-type.service';

export type ObjectTypeProviderClass = new (
  app: ObjectTreesApplicationInterface,
) => ObjectTypeProvider;

export type ObjectSubTypeDefintion = ObjectSubType & {
  typeName: string;
  subTypeName: string;
};
export abstract class ObjectTypeProvider {
  constructor(
    public name: string,
    protected app: ObjectTreesApplicationInterface,
  ) {
    console.log('Adding ' + this.name + '.');
  }
  async boot(): Promise<void> {
    console.log('Booting ' + this.name + '.');
  }
  objectTypes: {
    types: {[typeField: string]: Partial<ObjectType>};
    subTypes: Partial<ObjectSubTypeDefintion>[];
  } = {types: {}, subTypes: []};
  contentEntities: {
    contentType: string;
    cls: ServiceOrProviderClass;
    nameOrOptions?: string | ServiceOptions;
  }[] = [];
  entities: {
    services: {
      cls: ServiceOrProviderClass;
      nameOrOptions?: string | ServiceOptions;
    }[];
    accessRights: {
      cls: ServiceOrProviderClass;
      nameOrOptions?: string | ServiceOptions;
    }[];

    interceptors: {
      prepend: {
        id: string;
        interceptor: Interceptor | Constructor<Provider<Interceptor>>;
        nameOrOptions?: string | InterceptorBindingOptions;
      }[];
      append: {
        id: string;
        interceptor: Interceptor | Constructor<Provider<Interceptor>>;
        nameOrOptions?: string | InterceptorBindingOptions;
      }[];
    };
    controllers: {
      controllerCtor: ControllerClass;
      nameOrOptions?: string | BindingFromClassOptions;
    }[];
  } = {
    services: [],
    accessRights: [],
    interceptors: {prepend: [], append: []},
    controllers: [],
  };

  public async beforeBoot(
    app: ObjectTreesApplicationInterface,
    appCtx: ApplicationService,
    objectTypeService: ObjectTypeService,
  ): Promise<void> {
    const ctx: ApplicationExtensionContext = await appCtx
      .getExtensionContext<ApplicationExtensionContext>(this.name)
      .getOrSetValue(async () => {
        return new ApplicationExtensionContext();
      });
    // provider.objectTypes
    for (const typeField in this.objectTypes.types) {
      if (!ctx[typeField]) {
        ctx[typeField] = new ExpectedValue<ObjectType>();
      }
      await ctx[typeField].getOrSetValue(
        async (): Promise<ObjectType> => {
          let newType = await objectTypeService.searchByName(
            this.objectTypes.types[typeField].name as string,
          );

          if (!newType) {
            newType = await objectTypeService.add(
              this.objectTypes.types[typeField],
              new CurrentContext(),
            );
          }
          return newType;
        },
      );
    }

    for (const subType of this.objectTypes.subTypes) {
      const parentType = await objectTypeService.searchByName(
        subType.typeName as string,
      );
      const childType = await objectTypeService.searchByName(
        subType.subTypeName as string,
      );
      await objectTypeService.getOrCreateObjectSubType(
        parentType.id as string,
        childType.id as string,
        _.pick(subType, [
          'name',
          'acl',
          'owner',
          'namespace',
          'tree',
          'min',
          'max',
          'exclusions',
          'mandatories',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ]) as any,
      );
    }
    // provider.contentEntities
    // TODO : add new contentEntities management
    // provider.entities
    // TODO : add new entities management
  }
}
