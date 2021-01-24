import {IAccessRightsCRUD} from '@jacquesparis/objects-model';
import {EntityName} from '../../models/entity-name';
import {ApplicationService} from '../application.service';

export const ACCESS_RIGHT_PROVIDER = 'AccessRightsProvider';
export const AccessRightsEntity = EntityName;
export enum AccessRightsScope {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  method = 'method',
  view = 'view',
}
export enum AccessRightsMgt {
  access = 'access',
  owner = 'owner',
}
export enum AccessRightsPermission {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  access = 'access',
  owner = 'owner',
}

export class AccessRightsCRUD implements IAccessRightsCRUD {
  public delete: boolean;
  constructor(
    public create: boolean = false,
    public read: boolean = false,
    public update: boolean = false,
    _delete = false,
  ) {
    this.delete = _delete;
  }
}

export class AccessRightsSet {
  create = false;
  read = false;
  update = false;
  delete = false;
  access = false;
  owner = false;
  public toAccessRightsCRUD() {
    return new AccessRightsCRUD(
      this.create,
      this.read,
      this.update,
      this.delete,
    );
  }
}

export class AccessRightsPermissions {
  treeRootNode: AccessRightsSet = new AccessRightsSet();
  treeChildrenNodes: AccessRightsSet = new AccessRightsSet();
}

export const ACCESS_RIGHT_SUBTYPE = {
  name: 'Access Rights',
  acl: false,
  owner: false,
  namespace: false,
  tree: true,
  min: 1,
  max: 1,
  exclusions: [],
  mandatories: [],
};

export const ACCESS_RIGHTS_DEFINITION_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_DEFINITION,
  contentType: ApplicationService.CONTENT_TYPE.JSON,
  definition: {
    properties: {
      resetCreate: {
        type: 'boolean',
        title: 'Reset creation rights',
        default: false,
      },
      resetRead: {
        type: 'boolean',
        title: 'Reset read rights',
        default: false,
      },
      resetUpdate: {
        type: 'boolean',
        title: 'Reset update rights',
        default: false,
      },
      resetDelete: {
        type: 'boolean',
        title: 'Reset deletion rights',
        default: false,
      },
    },
  },
};

export const ACCESS_RIGHT_OWNERS_NODE = {
  name: 'Owners',
};

export const ACCESS_RIGHTS_GROUP_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
  contentType: ApplicationService.CONTENT_TYPE.JSON,
  definition: {
    properties: {
      grantCreate: {
        type: 'boolean',
        title: 'Grant creation rights',
        default: false,
      },
      grantRead: {
        type: 'boolean',
        title: 'Grant read rights',
        default: false,
      },
      grantUpdate: {
        type: 'boolean',
        title: 'Grant update rights',
        default: false,
      },
      grantDelete: {
        type: 'boolean',
        title: 'Grant deletion rights',
        default: false,
      },
    },
  },
};

export const ACCESS_RIGHTS_OWNERS_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS,
  contentType: ApplicationService.CONTENT_TYPE.JSON,
  definition: {
    properties: {
      resetOwner: {
        type: 'boolean',
        title: 'Reset owners rights',
        default: false,
      },
    },
  },
};

export const ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS,
  contentType: ApplicationService.CONTENT_TYPE.JSON,
  definition: {
    properties: {
      resetAccess: {
        type: 'boolean',
        title: 'Reset access management rights',
        default: false,
      },
    },
  },
};
