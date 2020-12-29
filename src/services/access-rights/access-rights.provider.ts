import {merge, omit} from 'lodash';
import {ObjectTreesApplicationInterface} from '../../application';
import {InterceptorTreatmentDescription} from '../../integration/extension-description';
import {ExtensionProvider} from './../../integration/extension.provider';
import {AccessRightsInterceptor} from './../../interceptors/access-rights.interceptor';
import {ApplicationService} from './../application.service';
import {ContentEntityCoreProvider} from './../content-entity/content-entity.provider';
import {UriCompleteProvider} from './../uri-complete/uri-complete.provider';
import {AccessRightsNodeService} from './access-rights-node.service';
import {AccessRightsTreeService} from './access-rights-tree.service';
import {AccessRightsTypeService} from './access-rights-type.service';
import {AccessRightsUserService} from './access-rights-user.service';
import {
  ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
  ACCESS_RIGHTS_DEFINITION_TYPE,
  ACCESS_RIGHTS_GROUP_TYPE,
  ACCESS_RIGHTS_OWNERS_TYPE,
  ACCESS_RIGHT_OWNERS_NODE,
  ACCESS_RIGHT_PROVIDER,
  ACCESS_RIGHT_SUBTYPE,
} from './access-rights.const';
import {AccessRightsService} from './access-rights.service';

export class AccessRightsProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(ACCESS_RIGHT_PROVIDER, app);
    this.requiredProviders.push(UriCompleteProvider, ContentEntityCoreProvider);

    this.services.push({cls: AccessRightsService});
    this.services.push({cls: AccessRightsTreeService});
    this.services.push({cls: AccessRightsNodeService});
    this.services.push({cls: AccessRightsTypeService});
    this.services.push({cls: AccessRightsUserService});

    this.interceptorsPrepend.push({
      id: 'AccessRightsInterceptor',
      interceptor: AccessRightsInterceptor,
      description: {
        preTreatment: new InterceptorTreatmentDescription(
          'Check access rights on target entity(ies)',
          ['AccessRightsService'],
        ),
        postTreatment: new InterceptorTreatmentDescription(
          'Remove forbidden entities',
          ['AccessRightsService'],
        ),
      },
    });

    this.objectTypes.push(
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        contentType: ApplicationService.CONTENT_TYPE.USER,
      },
      {
        name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
      },
      ACCESS_RIGHTS_DEFINITION_TYPE,
      ACCESS_RIGHTS_GROUP_TYPE,
      ACCESS_RIGHTS_OWNERS_TYPE,
      ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE,
    );

    this.objectSubTypes.push(
      merge(
        {
          typeName: () => this.appCtx.repositoryType.value.name,
          subTypeName: () => ACCESS_RIGHTS_DEFINITION_TYPE.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
      {
        typeName: () => ACCESS_RIGHTS_DEFINITION_TYPE.name,
        subTypeName: () => ACCESS_RIGHTS_GROUP_TYPE.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_GROUP,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => ACCESS_RIGHTS_GROUP_TYPE.name,
        subTypeName: () => ApplicationService.OBJECT_TYPE_NAMES.USER,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => ACCESS_RIGHTS_GROUP_TYPE.name,
        subTypeName: () => ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        name: ApplicationService.OBJECT_TYPE_NAMES.ANONYMOUS_USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => ACCESS_RIGHTS_DEFINITION_TYPE.name,
        subTypeName: () => ACCESS_RIGHTS_OWNERS_TYPE.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_OWNERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => ACCESS_RIGHTS_OWNERS_TYPE.name,
        subTypeName: () => ApplicationService.OBJECT_TYPE_NAMES.USER,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      {
        typeName: () => ACCESS_RIGHTS_DEFINITION_TYPE.name,
        subTypeName: () => ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE.name,
        name: ApplicationService.OBJECT_TYPE_NAMES.ACCESS_RIGHT_ACCESS_MANAGERS,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
        max: 1,
      },
      {
        typeName: () => ACCESS_RIGHTS_ACCESS_MANAGERS_TYPE.name,
        subTypeName: () => ApplicationService.OBJECT_TYPE_NAMES.USER,
        name: ApplicationService.OBJECT_TYPE_NAMES.USER,
        acl: false,
        namespace: false,
        owner: false,
        tree: false,
      },
      merge(
        {
          typeName: () => this.appCtx.folderType.value.name,
          subTypeName: () => ACCESS_RIGHTS_DEFINITION_TYPE.name,
        },
        ACCESS_RIGHT_SUBTYPE,
      ),
    );

    this.objectTrees = {
      rootACL: {
        parentNode: () => this.appCtx.rootNode.value,
        treeNodeTypeId: ACCESS_RIGHTS_DEFINITION_TYPE.name,
        treeNodeName:
          ApplicationService.OBJECT_NODE_NAMES.AccessRightsDefinition,
        tree: {
          treeNode: {},
          children: {
            [ACCESS_RIGHTS_OWNERS_TYPE.name]: {
              [ACCESS_RIGHT_OWNERS_NODE.name]: [
                {
                  treeNode: omit(ACCESS_RIGHT_OWNERS_NODE, [
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
          ApplicationService.OBJECT_NODE_NAMES.AccessRightsDefinition,
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
          ApplicationService.OBJECT_NODE_NAMES.AccessRightsDefinition,
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
          ApplicationService.OBJECT_NODE_NAMES.AccessRightsDefinition,
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
  }
}
