/* eslint-disable @typescript-eslint/no-unused-vars */
import {ObjectNodeService} from '../object-node/object-node.service';
import {ObjectType} from './../../models/object-type.model';
import {ApplicationService} from './../application.service';
import {ObjectTypeService} from './../object-type.service';
import {
  ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
  ACCESS_RIGHTS_DEFINITION_TYPE,
  ACCESS_RIGHTS_GROUP_TYPE,
  ACCESS_RIGHTS_OWNERS_TYPE,
  ACCESS_RIGHT_OWNERS_NODE,
  ACCESS_RIGHT_SUBTYPE,
} from './access-rights.const';
export class AccessRightsInit {
  ready: Promise<void>;
  constructor(
    protected appCtx: ApplicationService,
    protected objectTypeService: ObjectTypeService,
    protected objectNodeService: ObjectNodeService,
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
        return this.objectTypeService.registerApplicationType({
          name: ApplicationService.OBJECT_TYPE_NAMES.USER,
          contentType: ApplicationService.CONTENT_TYPE.USER,
        });
      },
    );

    const anonymousUserType: ObjectType = await this.appCtx.anonymousUserType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType({
          name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        });
      },
    );

    const accessRightsDefinition: ObjectType = await this.appCtx.accessRightsDefinitionType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(
          ACCESS_RIGHTS_DEFINITION_TYPE,
        );
      },
    );

    const accessRightsGroup: ObjectType = await this.appCtx.accessRightsGroupType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(
          ACCESS_RIGHTS_GROUP_TYPE,
        );
      },
    );

    const accessRightsOwners: ObjectType = await this.appCtx.accessRightsOwnersType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(
          ACCESS_RIGHTS_OWNERS_TYPE,
        );
      },
    );

    const accessRightsAccessManagers: ObjectType = await this.appCtx.accessRightsAccessManagersType.getOrSetValue(
      async (): Promise<ObjectType> => {
        return this.objectTypeService.registerApplicationType(
          ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
        );
      },
    );

    await this.objectTypeService.getOrCreateObjectSubType(
      (await this.appCtx.repositoryType.waitForValue).id as string,
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
        name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsDefinition.id as string,
      accessRightsOwners.id as string,
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsOwners.id as string,
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
      accessRightsDefinition.id as string,
      accessRightsAccessManagers.id as string,
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
    );
    await this.objectTypeService.getOrCreateObjectSubType(
      accessRightsAccessManagers.id as string,
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
      (await this.appCtx.tenantType.waitForValue).id as string,
      accessRightsDefinition.id as string,
      ACCESS_RIGHT_SUBTYPE,
    );

    const rootACL = (
      await this.objectNodeService.getOrCreateChildren(
        (await this.appCtx.rootNode.waitForValue).id as string,
        accessRightsDefinition.id as string,
        {name: ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition},
      )
    )[0];

    const rootACLOwners = (
      await this.objectNodeService.getOrCreateChildren(
        rootACL.id as string,
        accessRightsOwners.id as string,
        ACCESS_RIGHT_OWNERS_NODE,
      )
    )[0];

    const rooOwner = (
      await this.objectNodeService.getOrCreateChildren(
        rootACLOwners.id as string,
        userType.id as string,
        {
          name: 'Jacques Lebourgeois',
          contentUser: 'jacques.lebourgeois@gmail.com',
        },
      )
    )[0];
  }
}
