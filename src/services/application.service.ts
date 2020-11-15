import {DataObject} from '@loopback/repository';
import {Principal} from '@loopback/security';
import {ObjectNode} from '../models/object-node.model';
import {ObjectSubType} from '../models/object-sub-type.model';
import {ObjectType} from '../models/object-type.model';
import {ObjectTree} from './../models/object-tree.model';
import {AccessRightPermissions} from './access-rights/access-rights.const';

export class NodeContext {
  node: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  parent: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  parentType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  objectSubType: ExpectedValue<ObjectSubType> = new ExpectedValue<
    ObjectSubType
  >();
  objectType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
}

export class TreeContext {
  treeNode: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
}

export class AccessRightsContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rights: ExpectedValue<AccessRightPermissions> = new ExpectedValue<
    AccessRightPermissions
  >();
  user: ExpectedValue<Principal> = new ExpectedValue<Principal>();
  treeRootNodeId: ExpectedValue<string> = new ExpectedValue<string>();
  aclTrees: ExpectedValue<{[aclId: string]: ObjectTree}> = new ExpectedValue<{
    [aclId: string]: ObjectTree;
  }>();
}

export class TypeContext {
  types: ExpectedValue<{[id: string]: ObjectType}> = new ExpectedValue<{
    [id: string]: ObjectType;
  }>();
}

export class CurrentContext {
  public nodeContext: NodeContext = new NodeContext();
  public treeContext: TreeContext = new TreeContext();
  public accessRightsContexte: AccessRightsContext = new AccessRightsContext();
  public typeContext: TypeContext = new TypeContext();
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
  ROOT = 'root',
  USER = 'User',
  ANONYMOUS_USER = 'AnonymousUser',
  ACCESS_RIGHT_DEFINITION = 'AccessRightDefinition',
  ACCESS_RIGHT_GROUP = 'AccessRightGroup',
  ACCESS_RIGHT_OWNERS = 'AccessRightOwners',
  ACCESS_RIGHT_ACCESS_MANAGERS = 'AccessRightAccessManagers',
  TENANT = 'Tenant',
}

export class ApplicationService {
  public static OBJECT_TYPE_NAMES = ObjectTypeName;
  public static OBJECT_NODE_NAMES: {
    [objectType in ObjectTypeName]: string;
  } = {
    [ApplicationService.OBJECT_TYPE_NAMES.ROOT]: 'root',
    [ApplicationService.OBJECT_TYPE_NAMES.USER]: 'Admin',
    [ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER]: 'Anonymous User',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_DEFINITION]:
      'Access Rights',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP]: 'Users group',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS]: 'Owners group',
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS]:
      'Access Managers group',
    [ApplicationService.OBJECT_TYPE_NAMES.TENANT]: 'Tenant',
  };
  public static CONTENT_TYPE = {
    USER: 'ContentUser',
    JSON: '',
  };

  public rootType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  public tenantType: ExpectedValue<ObjectType> = new ExpectedValue<
    ObjectType
  >();
  public rooteNode: ExpectedValue<ObjectNode> = new ExpectedValue<ObjectNode>();
  public userType: ExpectedValue<ObjectType> = new ExpectedValue<ObjectType>();
  public anonymousUserType: ExpectedValue<ObjectType> = new ExpectedValue<
    ObjectType
  >();
  public accessRightsDefinitionType: ExpectedValue<
    ObjectType
  > = new ExpectedValue<ObjectType>();
  public accessRightsGroupType: ExpectedValue<ObjectType> = new ExpectedValue<
    ObjectType
  >();
  public accessRightsOwnersType: ExpectedValue<ObjectType> = new ExpectedValue<
    ObjectType
  >();
  public accessRightsAccessManagersType: ExpectedValue<
    ObjectType
  > = new ExpectedValue<ObjectType>();
  public ready: Promise<unknown> = Promise.all([
    this.tenantType.waitForValue,
    this.rootType.waitForValue,
    this.rooteNode.waitForValue,
    this.userType.waitForValue,
    this.anonymousUserType.waitForValue,
    this.accessRightsDefinitionType.waitForValue,
    this.accessRightsGroupType.waitForValue,
    this.accessRightsOwnersType.waitForValue,
    this.accessRightsAccessManagersType.waitForValue,
  ]);
}
