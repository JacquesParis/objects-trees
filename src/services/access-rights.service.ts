/* eslint-disable @typescript-eslint/no-unused-vars */
import {/* inject, */ BindingScope, injectable, service} from '@loopback/core';
import {EntityName} from './../models/entity-name';
import {ObjectType} from './../models/object-type.model';
import {ApplicationService, CurrentContext} from './application.service';
import {ObjectNodeService} from './object-node.service';
import {ObjectTypeService} from './object-type.service';

export const AccessRightsEntity = EntityName;
export enum AccessRightsScope {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'detele',
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

const ACCESS_RIGHTS_DEFINITION_TYPE = {
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
      resetAccess: {
        type: 'boolean',
        title: 'Reset access management rights',
        default: false,
      },
      resetOwner: {
        type: 'boolean',
        title: 'Reset owners rights',
        default: false,
      },
    },
  },
};

const ACCESS_RIGHT_OWNERS_NODE = {
  name: 'Owners',
  grantCreate: true,
  grantRead: true,
  grantUpdate: true,
  grantDelete: true,
  grantAccess: true,
  grantOwner: true,
};

const ACCESS_RIGHTS_GROUP_TYPE = {
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
      grantAccess: {
        type: 'boolean',
        title: 'Grant access management rights',
        default: false,
      },
      grantOwner: {
        type: 'boolean',
        title: 'Grant owners rights',
        default: false,
      },
    },
  },
};

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightsService {
  ready: Promise<void>;
  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
  ) {
    this.ready = new Promise<void>((resolve, reject) => {
      this.init().then(
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
      );
    });
  }
  private async init(): Promise<void> {
    const userType: ObjectType = await this.appCtx.userType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let type: ObjectType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.USER,
        );
        if (!type) {
          type = await this.objectTypeService.add(
            {
              name: ApplicationService.OBJECT_TYPE_NAMES.USER,
              contentType: ApplicationService.CONTENT_TYPE.USER,
            },
            new CurrentContext(),
          );
        }
        return type;
      },
    );

    const anonymousUserType: ObjectType = await this.appCtx.anonymousUserType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let type: ObjectType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        );
        if (!type) {
          type = await this.objectTypeService.add(
            {
              name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
            },
            new CurrentContext(),
          );
        }
        return type;
      },
    );

    const accessRightsDefinition: ObjectType = await this.appCtx.accessRightsDefinitionType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let type: ObjectType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_DEFINITION,
        );
        if (!type) {
          type = await this.objectTypeService.add(
            ACCESS_RIGHTS_DEFINITION_TYPE,
            new CurrentContext(),
          );
        }
        return type;
      },
    );

    const accessRightsGroup: ObjectType = await this.appCtx.accessRightsGroupType.getOrSetValue(
      async (): Promise<ObjectType> => {
        let type: ObjectType = await this.objectTypeService.searchByName(
          ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
        );
        if (!type) {
          type = await this.objectTypeService.add(
            ACCESS_RIGHTS_GROUP_TYPE,
            new CurrentContext(),
          );
        }
        return type;
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      (await this.appCtx.rootType.waitForValue).id as string,
      accessRightsDefinition.id as string,
      ACCESS_RIGHT_SUBTYPE,
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsDefinition.id as string,
      accessRightsGroup.id as string,
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsGroup.id as string,
      userType.id as string,
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsGroup.id as string,
      anonymousUserType.id as string,
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      (await this.appCtx.tenantType.waitForValue).id as string,
      accessRightsDefinition.id as string,
      ACCESS_RIGHT_SUBTYPE,
    );

    const rootACL = (
      await this.objectNodeService.getOrCreateChildren(
        (await this.appCtx.rooteNode.waitForValue).id as string,
        accessRightsDefinition.id as string,
        {name: ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition},
      )
    )[0];
    const rootACLGroup = this.objectNodeService.getOrCreateChildren(
      rootACL.id as string,
      accessRightsGroup.id as string,
      ACCESS_RIGHT_OWNERS_NODE,
    );
  }

  /*
   * Add service methods here
   */
}
