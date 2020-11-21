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
import {ApplicationError} from './../../helper/application-error';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {
  ApplicationExtensionContext,
  ApplicationService,
  ExpectedValue,
} from './../../services/application.service';
import {ObjectNodeService} from './../../services/object-node.service';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {ObjectTypeService} from './../../services/object-type.service';

export type ObjectTypeProviderClass = new (
  app: ObjectTreesApplicationInterface,
) => ObjectTypeProvider;

export type ObjectTypeDefinition = Partial<ObjectType> & {name: string};

export type ObjectSubTypeDefintion = Partial<ObjectSubType> & {
  typeName: string;
  subTypeName: string;
};

export interface ObjectTreeDefinition {
  treeNode: Partial<ObjectNode>;
  children: {
    [objectTypeId: string]: {
      [name: string]: ObjectTreeDefinition[];
    };
  };
}

export type CalculatedString = string | (() => string);
export type CalculatedNode =
  | {
      ownerTypeId: string;
      ownerName: string;
      namespaceTypeId: string;
      namespaceName: string;
    }
  | (() => Promise<ObjectNode>);
export abstract class ObjectTypeProvider {
  protected appCtx: ApplicationService;
  protected objectTypeService: ObjectTypeService;
  protected objectNodeService: ObjectNodeService;
  protected objectTreeService: ObjectTreeService;
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
    types: {[typeField: string]: ObjectTypeDefinition};
    subTypes: ObjectSubTypeDefintion[];
  } = {types: {}, subTypes: []};
  objectTrees: {
    [nodeField: string]: {
      parentNode: CalculatedNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
  } = {};
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

  public async beforeBoot(appCtx: ApplicationService): Promise<void> {
    this.appCtx = appCtx;
    this.objectTreeService = await this.app.getService<ObjectTreeService>(
      ObjectTreeService,
    );
    this.objectNodeService = await this.app.getService<ObjectNodeService>(
      ObjectNodeService,
    );
    this.objectTypeService = await this.app.getService<ObjectTypeService>(
      ObjectTypeService,
    );

    const ctx: ApplicationExtensionContext = await appCtx
      .getExtensionContext<ApplicationExtensionContext>(this.name)
      .getOrSetValue(async () => {
        return new ApplicationExtensionContext();
      });
    // provider.objectTypes
    for (const typeField in this.objectTypes.types) {
      if (!ctx.types[typeField]) {
        ctx.types[typeField] = new ExpectedValue<ObjectType>();
      }
      await ctx.types[typeField].getOrSetValue(
        async (): Promise<ObjectType> => {
          return this.objectTypeService.registerApplicationType(
            this.objectTypes.types[typeField],
          );
        },
      );
    }

    for (const subType of this.objectTypes.subTypes) {
      const parentType = await this.objectTypeService.searchByName(
        subType.typeName as string,
      );
      const childType = await this.objectTypeService.searchByName(
        subType.subTypeName as string,
      );
      await this.objectTypeService.getOrCreateObjectSubType(
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

    //provider.objetTrees

    for (const nodeField in this.objectTrees) {
      if (!ctx.nodes[nodeField]) {
        ctx.nodes[nodeField] = new ExpectedValue<ObjectNode>();
      }
      await ctx.nodes[nodeField].getOrSetValue(
        async (): Promise<ObjectNode> => {
          let parentNode: ObjectNode;
          if (_.isFunction(this.objectTrees[nodeField].parentNode)) {
            parentNode = await (this.objectTrees[nodeField]
              .parentNode as () => Promise<ObjectNode>)();
          } else {
            throw ApplicationError.notImplemented({
              method: 'ObjectTypeProvider.objectTrees',
              parentNodeId: 'using namespace',
            });
          }
          return this.objectTreeService.registerApplicationTree(
            parentNode,
            this.objectTrees[nodeField].treeNodeName,
            this.objectTrees[nodeField].treeNodeTypeId,
            this.objectTrees[nodeField].tree,
          );
        },
      );
    }
  }
}
