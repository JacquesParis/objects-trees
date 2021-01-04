import {
  BindingFromClassOptions,
  BindingScope,
  Constructor,
  ContextBindings,
  ControllerClass,
  Interceptor,
  InterceptorBindingOptions,
  Provider,
  ServiceOptions,
  ServiceOrProviderClass,
} from '@loopback/core';
import {Class, juggler, Repository} from '@loopback/repository';
import * as _ from 'lodash';
import {camelCase} from 'lodash';
import {ObjectTreesApplicationInterface} from '../application';
import {ObjectSubType} from '../models';
import {ObjectNode} from '../models/object-node.model';
import {ObjectType} from '../models/object-type.model';
import {
  ApplicationExtensionContext,
  ApplicationService,
  ExpectedValue,
} from '../services/application.service';
import {ObjectNodeService} from '../services/object-node/object-node.service';
import {ObjectTreeService} from '../services/object-tree/object-tree.service';
import {ObjectTypeService} from '../services/object-type.service';
import {DataEntity} from './../models/data-entity.model';
import {
  InterceptorDescription,
  RunnerTreatmentDescription,
} from './extension-description';

export type ExtensionProviderClass = new (
  app: ObjectTreesApplicationInterface,
) => ExtensionProvider;

export type ObjectTypeDefinition = Partial<ObjectType> & {name: string};

export type CalculatedString = string | (() => string);
export type ObjectSubTypeDefintion = Partial<ObjectSubType> & {
  typeName: CalculatedString;
  subTypeName: CalculatedString;
};

export interface ObjectTreeDefinition {
  treeNode: Partial<ObjectNode>;
  children: {
    [objectTypeId: string]: {
      [name: string]: ObjectTreeDefinition[];
    };
  };
}

export type CalculatedNode =
  | {
      ownerTypeId: string;
      ownerName: string;
      namespaceTypeId: string;
      namespaceName: string;
    }
  | (() => Promise<ObjectNode>);
export abstract class ExtensionProvider {
  protected appCtx: ApplicationService;
  protected ctx: ApplicationExtensionContext;
  protected objectTypeService: ObjectTypeService;
  protected objectNodeService: ObjectNodeService;
  protected objectTreeService: ObjectTreeService;
  constructor(
    public name: string,
    protected app: ObjectTreesApplicationInterface,
  ) {
    console.log('Adding ' + this.name + '.');
  }
  requiredProviders: ExtensionProviderClass[] = [];

  _objectTypes: {[typeField: string]: ObjectTypeDefinition} = {};

  objectTypes: ObjectTypeDefinition[] = [];

  objectSubTypes: ObjectSubTypeDefintion[] = [];

  objectTrees: {
    [nodeField: string]: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      reset?: boolean;
      tree: ObjectTreeDefinition;
    };
  } = {};

  services: {
    cls: ServiceOrProviderClass;
    nameOrOptions?: string | ServiceOptions;
  }[] = [];

  models: Class<DataEntity>[] = [];

  repositories: {
    repoClass: Class<Repository<DataEntity>>;
    nameOrOptions?: string | BindingFromClassOptions | undefined;
  }[] = [];

  interceptorsPrepend: {
    id: string;
    interceptor: Interceptor | Constructor<Provider<Interceptor>>;
    nameOrOptions?: string | InterceptorBindingOptions;
    description: InterceptorDescription;
  }[] = [];

  interceptorsAppend: {
    id: string;
    interceptor: Interceptor | Constructor<Provider<Interceptor>>;
    nameOrOptions?: string | InterceptorBindingOptions;
    description: InterceptorDescription;
  }[] = [];

  controllers: {
    controllerCtor: ControllerClass;
    nameOrOptions?: string | BindingFromClassOptions;
    description: RunnerTreatmentDescription;
  }[] = [];

  dataSources: {
    dataSource: juggler.DataSource | Class<juggler.DataSource>;
    name: string;
  }[] = [];

  public async setContext(appCtx: ApplicationService): Promise<void> {
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

    this.ctx = appCtx.getExtensionContext<ApplicationExtensionContext>(
      this.name,
    );
  }

  public async beforeBoot(): Promise<void> {
    console.log('Initialising ' + this.name + '.');
    for (const dataSource of this.dataSources) {
      let name = dataSource.name;
      if (name.startsWith('datasources.')) {
        name = name.substr('datasources.'.length);
      }
      this.app
        .dataSource(dataSource.dataSource, name)
        .inScope(BindingScope.SINGLETON);
    }

    for (const model of this.models) {
      this.app.model(model);
    }

    for (const repository of this.repositories) {
      this.app.repository(repository.repoClass, repository.nameOrOptions);
    }

    for (const serviceProvider of this.services) {
      this.app.service(
        serviceProvider.cls,
        serviceProvider.nameOrOptions
          ? serviceProvider.nameOrOptions
          : {defaultScope: BindingScope.SINGLETON},
      );
      await this.app.getService(serviceProvider.cls);
      console.log(serviceProvider.cls.name + ' started !');
    }
    for (const interceptorProvider of this.interceptorsAppend) {
      this.app.addInterceptor(this.name, interceptorProvider);
      const binding = this.app.getBinding(
        ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS,
      );
      const interceptor: string[] = binding.getValue(this.app) as string[];
      interceptor.push(interceptorProvider.id);
      binding.to(interceptor);
      console.log(
        'Interceptors list updated',
        this.app
          .getBinding(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS)
          .getValue(this.app),
      );
    }
    for (const interceptorProvider of this.interceptorsPrepend) {
      this.app.addInterceptor(this.name, interceptorProvider);

      const binding = this.app.getBinding(
        ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS,
      );
      const interceptor: string[] = binding.getValue(this.app) as string[];
      interceptor.unshift(interceptorProvider.id);
      binding.to(interceptor);
      console.log(
        'Interceptors list updated',
        this.app
          .getBinding(ContextBindings.GLOBAL_INTERCEPTOR_ORDERED_GROUPS)
          .getValue(this.app),
      );
    }

    for (const controller of this.controllers) {
      this.app.addController(this.name, controller);
    }

    for (const objectType of this.objectTypes) {
      const typeField = camelCase(objectType.name);
      if (!this.ctx.types[typeField]) {
        this.ctx.types[typeField] = new ExpectedValue<ObjectType>();
      }
      await this.ctx.types[typeField].getOrSetValue(
        async (): Promise<ObjectType> => {
          return this.objectTypeService.registerApplicationType(objectType);
        },
      );
    }

    for (const subType of this.objectSubTypes) {
      const typeName = _.isString(subType.typeName)
        ? subType.typeName
        : subType.typeName();
      const subTypeName = _.isString(subType.subTypeName)
        ? subType.subTypeName
        : subType.subTypeName();
      if (!subType.name) {
        subType.name = subTypeName;
      }
      await this.objectTypeService.getOrCreateObjectSubType(
        typeName,
        subTypeName,
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
  }
  async boot(): Promise<void> {
    console.log('Booting ' + this.name + '.');
    for (const nodeField in this.objectTrees) {
      if (!this.ctx.nodes[nodeField]) {
        this.ctx.nodes[nodeField] = new ExpectedValue<ObjectNode>();
      }
      await this.ctx.nodes[nodeField].getOrSetValue(
        async (): Promise<ObjectNode> => {
          return this.objectTreeService.registerApplicationTree(
            this.objectTrees[nodeField].parentNode(),
            this.objectTrees[nodeField].treeNodeName,
            this.objectTrees[nodeField].treeNodeTypeId,
            this.objectTrees[nodeField].tree,
            !!this.objectTrees[nodeField].reset,
          );
        },
      );
    }
    this.ctx.resolve();
  }
}
