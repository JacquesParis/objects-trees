import {IRestEntity} from '@jacquesparis/objects-model';
import {DataObject} from '@loopback/repository';
import {Principal} from '@loopback/security';
import * as _ from 'lodash';
import {ObjectNode} from '../models/object-node.model';
import {ObjectSubType} from '../models/object-sub-type.model';
import {ObjectType} from '../models/object-type.model';
import {ApplicationError} from './../helper/application-error';
import {HtmlGeneratedResponse} from './../helper/generated-response';
import {TreatmentDescription} from './../integration/extension-description';
import {EntityName} from './../models/entity-name';
import {ObjectTree} from './../models/object-tree.model';
import {ObjectTypeRelations} from './../models/object-type.model';
import {
  AccessRightsPermissions,
  AccessRightsSet,
} from './access-rights/access-rights.const';

export enum EntityActionType {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
}

export class EntityActions {
  [controllerName: string]: {
    entityName: EntityName;
    entityActionType: EntityActionType;
  };
}

export class MethodContext {
  entity: ExpectedValue<IRestEntity> = new ExpectedValue<IRestEntity>();
}
export class NodeContext {
  node: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  tree: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  owner: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  namespace: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  parent: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  parentType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  objectSubType: ExpectedValue<ObjectSubType> = new ExpectedValue<ObjectSubType>();
  objectType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  brothers: ExpectedValue<ObjectNode[]> = new ExpectedValue<ObjectNode[]>();
  references: {
    [treeId: string]: ExpectedValue<ObjectNode>;
  } = {};
}

export class TreeContext {
  treeNode: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  treeType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  treeChildren: ExpectedValue<ObjectNode[]> = new ExpectedValue<ObjectNode[]>();
}

export class AccessRightsContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rights: ExpectedValue<AccessRightsPermissions> = new ExpectedValue<AccessRightsPermissions>();
  user: ExpectedValue<Principal> = new ExpectedValue<Principal>();
  treeRootNodeId: ExpectedValue<string> = new ExpectedValue<string>();
  aclTrees: ExpectedValue<{[aclId: string]: ObjectTree}> = new ExpectedValue<{
    [aclId: string]: ObjectTree;
  }>();
  rootRights: ExpectedValue<AccessRightsSet> = new ExpectedValue<AccessRightsSet>();
  authorization: ExpectedValue<string> = new ExpectedValue<string>();
}

export class TypeContext {
  types: ExpectedValue<{[id: string]: ObjectType}> = new ExpectedValue<{
    [id: string]: ObjectType;
  }>();
}

export class UriContext {
  uri: ExpectedValue<{
    baseUri: string;
    objectUri: string;
    method: string;
    host: string;
    protocol: string;
  }> = new ExpectedValue();
  returnedEntity: ExpectedValue<
    IRestEntity | IRestEntity[]
  > = new ExpectedValue<IRestEntity | IRestEntity[]>();
}

export class WebSiteContext {
  webSiteTree: ExpectedValue<ObjectTree> = new ExpectedValue<ObjectTree>();
  webSitePageNode: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  pageBaseUri: ExpectedValue<string> = new ExpectedValue<string>();
  siteBaseUriTree: ExpectedValue<ObjectTree> = new ExpectedValue<ObjectTree>();
  cachedPage: ExpectedValue<HtmlGeneratedResponse> = new ExpectedValue<HtmlGeneratedResponse>();
}

export class CurrentContext {
  public nodeContext: NodeContext = new NodeContext();
  public treeContext: TreeContext = new TreeContext();
  public accessRightsContext: AccessRightsContext = new AccessRightsContext();
  public typeContext: TypeContext = new TypeContext();
  public uriContext: UriContext = new UriContext();
  public methodContext: MethodContext = new MethodContext();
  public webSiteContext: WebSiteContext = new WebSiteContext();
  public static get(value: DataObject<CurrentContext>): CurrentContext {
    const ctx = new CurrentContext();
    if (value) {
      for (const key in value) {
        if (key in ctx) {
          Object.assign(ctx[key], value[key]);
        } else {
          ctx[key] = value[key];
        }
      }
    }
    return ctx;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export const CURRENT_CONTEXT = 'CURRENT_CONTEXT';

export class ExpectedValue<T> {
  private _value: T = (undefined as unknown) as T;
  private resolveValue: (value: T) => void;
  constructor(value?: T) {
    if (undefined !== value) {
      this.value = (value as unknown) as T;
    }
  }
  public waitForValue: Promise<T> = new Promise<T>((resolve, reject) => {
    this.resolveValue = resolve;
  });

  public get value(): T {
    return this._value;
  }
  public set value(value: T) {
    this._value = value;
    this.resolveValue(this.value);
  }
  public async getOrSetValue(searchValue: () => Promise<T>): Promise<T> {
    if (undefined === this.value) {
      this.value = await searchValue();
    }
    return this.value;
  }
}

export enum ObjectTypeName {
  REPOSITORY = 'Repository',
  USER = 'User',
  ANONYMOUS_USER = 'AnonymousUser',
  ACCESS_RIGHT_DEFINITION = 'AccessRightsDefinition',
  ACCESS_RIGHT_GROUP = 'AccessRightsGroup',
  ACCESS_RIGHT_OWNERS = 'AccessRightsOwners',
  ACCESS_RIGHT_ACCESS_MANAGERS = 'AccessRightsAccessManagers',
  TENANT = 'Tenant',
  REPOSITORY_CATEGORY = 'RepositoryCategory',
}

export class ApplicationExtensionContext {
  resolve: () => void;
  reject: () => void;
  ready: Promise<void> = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
  types: {
    [key: string]: ExpectedValue<ObjectType>;
  } = {};
  nodes: {
    [key: string]: ExpectedValue<ObjectNode>;
  } = {};
}

export class AccessRightsProviderContext extends ApplicationExtensionContext {
  types: {
    user: ExpectedValue<ObjectType>;
    anonymousUser: ExpectedValue<ObjectType>;
    accessRightsDefinition: ExpectedValue<ObjectType>;
    accessRightsGroup: ExpectedValue<ObjectType>;
    accessRightsOwners: ExpectedValue<ObjectType>;
    accessRightsAccessManagers: ExpectedValue<ObjectType>;
    [key: string]: ExpectedValue<ObjectType>;
  } = {
    user: new ExpectedValue<ObjectType>(),
    anonymousUser: new ExpectedValue<ObjectType>(),
    accessRightsDefinition: new ExpectedValue<ObjectType>(),
    accessRightsGroup: new ExpectedValue<ObjectType>(),
    accessRightsOwners: new ExpectedValue<ObjectType>(),
    accessRightsAccessManagers: new ExpectedValue<ObjectType>(),
  };
  nodes: {
    rootACL: ExpectedValue<ObjectNode>;
    [key: string]: ExpectedValue<ObjectNode>;
  } = {rootACL: new ExpectedValue<ObjectNode>()};
}
export class ObjectTreeProviderContext extends ApplicationExtensionContext {
  types: {
    repository: ExpectedValue<ObjectType>;
    category: ExpectedValue<ObjectType>;
    tenant: ExpectedValue<ObjectType>;
    folder: ExpectedValue<ObjectType>;
    [key: string]: ExpectedValue<ObjectType>;
  } = {
    repository: new ExpectedValue<ObjectType>(),
    category: new ExpectedValue<ObjectType>(),
    tenant: new ExpectedValue<ObjectType>(),
    folder: new ExpectedValue<ObjectType>(),
  };
  nodes: {
    root: ExpectedValue<ObjectNode>;
    public: ExpectedValue<ObjectNode>;
    publicTemplates: ExpectedValue<ObjectNode>;
    demonstrationAccount: ExpectedValue<ObjectNode>;
    demonstrationExamples: ExpectedValue<ObjectNode>;
    demonstrationSandbox: ExpectedValue<ObjectNode>;
    [key: string]: ExpectedValue<ObjectNode>;
  } = {
    root: new ExpectedValue<ObjectNode>(),
    public: new ExpectedValue<ObjectNode>(),
    publicTemplates: new ExpectedValue<ObjectNode>(),
    demonstrationAccount: new ExpectedValue<ObjectNode>(),
    demonstrationExamples: new ExpectedValue<ObjectNode>(),
    demonstrationSandbox: new ExpectedValue<ObjectNode>(),
  };
}
export class ApplicationService {
  public static OBJECT_TYPE_NAMES = ObjectTypeName;
  public static OBJECT_NODE_NAMES: {
    [objectType in ObjectTypeName]: string;
  } = {
    [ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY]: 'root',
    [ApplicationService.OBJECT_TYPE_NAMES.USER]: 'Admin',
    [ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER]: 'Anonymous User',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_DEFINITION]:
      'Access Rights',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP]: 'Users group',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS]: 'Owners group',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS]:
      'Access Managers group',
    [ApplicationService.OBJECT_TYPE_NAMES.TENANT]: 'Tenant',
    [ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY]: 'Category',
  };
  public static CONTENT_TYPE = {
    USER: 'ContentUser',
    JSON: '',
  };
  public configSummary: TreatmentDescription;

  public get repositoryType(): ExpectedValue<ObjectType> {
    return this.extensions.ObjectTreeProvider.types.repository;
  }
  public get categoryType(): ExpectedValue<ObjectType> {
    return this.extensions.ObjectTreeProvider.types.category;
  }
  public get tenantType(): ExpectedValue<ObjectType> {
    return this.extensions.ObjectTreeProvider.types.tenant;
  }
  public get folderType(): ExpectedValue<ObjectType> {
    return this.extensions.ObjectTreeProvider.types.folder;
  }
  public get rootNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.root;
  }
  public get publicNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.public;
  }
  public get demonstrationAccountNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.demonstrationAccount;
  }
  public get demonstrationExamplesNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.demonstrationExamples;
  }
  public get demonstrationSandboxNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.demonstrationSandbox;
  }
  public get publicTemplatesNode(): ExpectedValue<ObjectNode> {
    return this.extensions.ObjectTreeProvider.nodes.publicTemplates;
  }
  public get userType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types.user;
  }
  public get anonymousUserType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types.anonymousUser;
  }
  public get accessRightsDefinitionType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types.accessRightsDefinition;
  }
  public get accessRightsGroupType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types.accessRightsGroup;
  }
  public get accessRightsOwnersType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types.accessRightsOwners;
  }
  public get accessRightsAccessManagersType(): ExpectedValue<ObjectType> {
    return this.extensions.AccessRightsProvider.types
      .accessRightsAccessManagers;
  }

  public entityActions: EntityActions = {};

  private extensions: {
    [key: string]: ApplicationExtensionContext;
    ObjectTreeProvider: ObjectTreeProviderContext;
    AccessRightsProvider: AccessRightsProviderContext;
  } = {
    ObjectTreeProvider: new ObjectTreeProviderContext(),
    AccessRightsProvider: new AccessRightsProviderContext(),
  };
  public ready: Promise<unknown> = Promise.all([
    this.tenantType.waitForValue,
    this.repositoryType.waitForValue,
    this.rootNode.waitForValue,
    this.userType.waitForValue,
    this.anonymousUserType.waitForValue,
    this.accessRightsDefinitionType.waitForValue,
    this.accessRightsGroupType.waitForValue,
    this.accessRightsOwnersType.waitForValue,
    this.accessRightsAccessManagersType.waitForValue,
  ]);
  public allTypes: ExpectedValue<{
    [nameId: string]: ObjectType & ObjectTypeRelations;
  }> = new ExpectedValue<{
    [nameId: string]: ObjectType & ObjectTypeRelations;
  }>();
  public implementedTypes: ExpectedValue<{
    [type: string]: string[];
  }> = new ExpectedValue();
  public implementingTypes: ExpectedValue<{
    [type: string]: string[];
  }> = new ExpectedValue();
  implementingCommonTypes: ExpectedValue<{
    [type: string]: string[];
  }> = new ExpectedValue();
  public getExtensionContext<T extends ApplicationExtensionContext>(
    extensionNameOrClass: string | {name: string},
  ): T {
    const extensionName = _.isString(extensionNameOrClass)
      ? extensionNameOrClass
      : extensionNameOrClass.name;
    if (!extensionName.endsWith('Provider')) {
      throw ApplicationError.unauthorizedValue({
        extensionName: 'Extension name should end with Provider',
      });
    }
    if (!(extensionName in this.extensions)) {
      this.extensions[extensionName] = new ApplicationExtensionContext();
    }
    return (this.extensions[extensionName] as unknown) as T;
  }
}
