import {bind, BindingScope} from '@loopback/core';
import {DataObject} from '@loopback/repository';
import {ObjectNode} from '../models/object-node.model';
import {ObjectSubType} from '../models/object-sub-type.model';
import {ObjectType} from '../models/object-type.model';

export class NodeContext {
  parent?: ObjectNode;
  parentType?: ObjectType;
  objectSubType?: ObjectSubType;
  objectType?: ObjectType;
}

export class CurrentContext {
  public nodeContext: NodeContext = {};
  public static get(value: DataObject<CurrentContext>): CurrentContext {
    const ctx = new CurrentContext();
    if (value) {
      for (const key in value) {
        if (key in this) {
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

class ExpectedValue<T> {
  private _value: T;
  private resolveValue: (value: T) => void;
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
    if (!this.value) {
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
  TENANT = 'Tenant',
}

@bind({scope: BindingScope.SINGLETON})
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
    [ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP]: 'Default users',
    [ApplicationService.OBJECT_TYPE_NAMES.TENANT]: 'Default tenant',
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
  public ready: Promise<unknown> = Promise.all([
    this.tenantType.waitForValue,
    this.rootType.waitForValue,
    this.rooteNode.waitForValue,
    this.userType.waitForValue,
    this.anonymousUserType.waitForValue,
    this.accessRightsDefinitionType.waitForValue,
    this.accessRightsGroupType.waitForValue,
  ]);
}
