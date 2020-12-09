import * as _ from 'lodash';
import {ObjectTreesApplicationInterface} from '../../application';
import {
  ExtensionProvider,
  ObjectTreeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {AccessRightsInterceptor} from './../../interceptors/access-rights.interceptor';
import {ObjectNode} from './../../models/object-node.model';
import {ApplicationService} from './../application.service';
import {ContentEntityCoreProvider} from './../content-entity/content-entity.provider';
import {AccessRightNodeService} from './access-rights-node.service';
import {AccessRightTreeService} from './access-rights-tree.service';
import {AccessRightTypeService} from './access-rights-type.service';
import {AccessRightUserService} from './access-rights-user.service';
import {
  ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
  ACCESS_RIGHTS_DEFINITION_TYPE,
  ACCESS_RIGHTS_GROUP_TYPE,
  ACCESS_RIGHTS_OWNERS_TYPE,
  ACCESS_RIGHT_OWNERS_NODE,
  ACCESS_RIGHT_SUBTYPE,
} from './access-rights.const';
import {AccessRightsService} from './access-rights.service';

export class AccessRightsProvider extends ExtensionProvider {
  objectTypes: {
    user: ObjectTypeDefinition;
    anonymousUser: ObjectTypeDefinition;
    accessRightsDefinition: ObjectTypeDefinition;
    accessRightsGroup: ObjectTypeDefinition;
    accessRightsOwners: ObjectTypeDefinition;
    accessRightsAccessManagers: ObjectTypeDefinition;
  };

  objectTrees: {
    rootACL: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
    publicACL: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
    demonstrationAccountACL: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
    demonstrationSandboxACL: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
  };

  constructor(protected app: ObjectTreesApplicationInterface) {
    super('AccessRightsService', app);
    this.requiredProviders.push(ContentEntityCoreProvider);
    this.objectTypes = {
      user: {
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        contentType: ApplicationService.CONTENT_TYPE.USER,
      },
      anonymousUser: {
        name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
      },
      accessRightsDefinition: ACCESS_RIGHTS_DEFINITION_TYPE,
      accessRightsGroup: ACCESS_RIGHTS_GROUP_TYPE,
      accessRightsOwners: ACCESS_RIGHTS_OWNERS_TYPE,
      accessRightsAccessManagers: ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
    };

    this.objectSubTypes.push(
      _.merge(
        {
          typeName: () => this.appCtx.repositoryType.value.name,
          subTypeName: () => this.objectTypes.accessRightsDefinition.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
    );
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsDefinition.name,
      subTypeName: () => this.objectTypes.accessRightsGroup.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsGroup.name,
      subTypeName: () => this.objectTypes.user.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.USER,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsGroup.name,
      subTypeName: () => this.objectTypes.anonymousUser.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
      max: 1,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsDefinition.name,
      subTypeName: () => this.objectTypes.accessRightsOwners.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
      max: 1,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsOwners.name,
      subTypeName: () => this.objectTypes.user.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.USER,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsDefinition.name,
      subTypeName: () => this.objectTypes.accessRightsAccessManagers.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
      max: 1,
    });
    this.objectSubTypes.push({
      typeName: () => this.objectTypes.accessRightsAccessManagers.name,
      subTypeName: () => this.objectTypes.user.name,
      name: ApplicationService.OBJECT_TYPE_NAMES.USER,
      acl: false,
      namespace: false,
      owner: false,
      tree: false,
    });
    this.objectSubTypes.push(
      _.merge(
        {
          typeName: () => this.appCtx.folderType.value.name,
          subTypeName: () => this.objectTypes.accessRightsDefinition.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
    );

    this.objectTrees = {
      rootACL: {
        parentNode: () => this.appCtx.rootNode.value,
        treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
        treeNodeName:
          ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition,
        tree: {
          treeNode: {},
          children: {
            [ACCESS_RIGHTS_OWNERS_TYPE.name]: {
              [ACCESS_RIGHT_OWNERS_NODE.name]: [
                {
                  treeNode: _.omit(ACCESS_RIGHT_OWNERS_NODE, [
                    'name',
                    'objectTypeId',
                  ]),
                  children: {
                    [ApplicationService.OBJECT_TYPE_NAMES.USER]: {
                      'Jacques Lebourgeois': [
                        {
                          treeNode: {
                            contentUser: 'jacques.lebourgeois@gmail.com',
                          },
                          children: {},
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
      publicACL: {
        parentNode: () => this.appCtx.publicNode.value,
        treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
        treeNodeName:
          ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition,
        tree: {
          treeNode: {},
          children: {
            [ACCESS_RIGHTS_GROUP_TYPE.name]: {
              ['Public access']: [
                {
                  treeNode: {
                    grantRead: true,
                    grantUpdate: false,
                    grantDelete: false,
                    grantCreate: false,
                  },
                  children: {
                    [ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER]: {
                      Anonymous: [
                        {
                          treeNode: {},
                          children: {},
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
      demonstrationAccountACL: {
        parentNode: () => this.appCtx.demonstrationAccountNode.value,
        treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
        treeNodeName:
          ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition,
        tree: {
          treeNode: {},
          children: {
            [ACCESS_RIGHTS_GROUP_TYPE.name]: {
              ['Demonstration access']: [
                {
                  treeNode: {
                    grantRead: true,
                    grantUpdate: false,
                    grantDelete: false,
                    grantCreate: false,
                  },
                  children: {
                    [ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER]: {
                      Anonymous: [
                        {
                          treeNode: {},
                          children: {},
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
      demonstrationSandboxACL: {
        parentNode: () => this.appCtx.demonstrationSandboxNode.value,
        treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
        treeNodeName:
          ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition,
        tree: {
          treeNode: {},
          children: {
            [ACCESS_RIGHTS_GROUP_TYPE.name]: {
              ['Sandbox access']: [
                {
                  treeNode: {
                    grantRead: true,
                    grantUpdate: true,
                    grantDelete: true,
                    grantCreate: true,
                  },
                  children: {
                    [ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER]: {
                      Anonymous: [
                        {
                          treeNode: {},
                          children: {},
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    };

    this.services.push({cls: AccessRightsService});
    this.services.push({cls: AccessRightTreeService});
    this.services.push({cls: AccessRightNodeService});
    this.services.push({cls: AccessRightTypeService});
    this.services.push({cls: AccessRightUserService});

    this.interceptorsPrepend.push({
      id: 'AccessRightsInterceptor',
      interceptor: AccessRightsInterceptor,
    });
  }
}
