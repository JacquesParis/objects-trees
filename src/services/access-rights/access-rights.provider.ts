import * as _ from 'lodash';
import {ObjectTreesApplicationInterface} from '../../application';
import {
  ExtensionProvider,
  ObjectSubTypeDefintion,
  ObjectTreeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {AccessRightsInterceptor} from './../../interceptors/access-rights.interceptor';
import {ObjectNode} from './../../models/object-node.model';
import {ApplicationService} from './../application.service';
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
    types: {
      user: ObjectTypeDefinition;
      anonymousUser: ObjectTypeDefinition;
      accessRightsDefinition: ObjectTypeDefinition;
      accessRightsGroup: ObjectTypeDefinition;
      accessRightsOwners: ObjectTypeDefinition;
      accessRightsAccessManagers: ObjectTypeDefinition;
    };
    subTypes: ObjectSubTypeDefintion[];
  } = {
    types: {
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
    },
    subTypes: [],
  };

  objectTrees: {
    rootACL: {
      parentNode: () => ObjectNode;
      treeNodeTypeId: string;
      treeNodeName: string;
      tree: ObjectTreeDefinition;
    };
  } = {
    rootACL: {
      parentNode: () => this.appCtx.rootNode.value,
      treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
      treeNodeName: ApplicationService.OBJECT_NODE_NAMES.AccessRightDefinition,
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
  };

  constructor(protected app: ObjectTreesApplicationInterface) {
    super('AccessRightsService', app);

    this.objectTypes.subTypes = [
      _.merge(
        {
          typeName: () => this.appCtx.repositoryType.value.name,
          subTypeName: () => this.objectTypes.types.accessRightsDefinition.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
      {
        typeName: () => this.objectTypes.types.accessRightsDefinition.name,
        subTypeName: () => this.objectTypes.types.accessRightsGroup.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsGroup.name,
        subTypeName: () => this.objectTypes.types.user.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsGroup.name,
        subTypeName: () => this.objectTypes.types.anonymousUser.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsDefinition.name,
        subTypeName: () => this.objectTypes.types.accessRightsOwners.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsOwners.name,
        subTypeName: () => this.objectTypes.types.user.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsDefinition.name,
        subTypeName: () =>
          this.objectTypes.types.accessRightsAccessManagers.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => this.objectTypes.types.accessRightsAccessManagers.name,
        subTypeName: () => this.objectTypes.types.user.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      _.merge(
        {
          typeName: () => this.appCtx.tenantType.value.name,
          subTypeName: () => this.objectTypes.types.accessRightsDefinition.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
    ];

    this.entities.services = [
      {cls: AccessRightsService},
      {cls: AccessRightTreeService},
      {cls: AccessRightNodeService},
      {cls: AccessRightTypeService},
      {cls: AccessRightUserService},
    ];
    this.entities.interceptors.prepend = [
      {
        id: 'AccessRightsInterceptor',
        interceptor: AccessRightsInterceptor,
      },
    ];
  }
}
