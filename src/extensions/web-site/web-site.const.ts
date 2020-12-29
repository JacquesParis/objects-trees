import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from '../../integration/extension.provider';
import {ObjectTypeName} from '../../services/application.service';
import {
  PUBLIC_OBJECT_NAME,
  REPOSITORY_CATEGORY_TYPE,
  TEMPLATES_OBJECT_NAME,
} from '../../services/object-tree/object-tree.const';
import {
  TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE,
  TEMPLATE_VIEW_TYPE,
} from './../content-generic-template/content-generic-template.const';
export const WEB_SITE_PROVIDER = 'WebSiteProvider';
export const WEB_SITE_NAME = 'WebSiteService';

export const WEB_SITE_VIEW_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteView',
  inheritedTypesIds: [TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE.name],
  definition: {
    properties: {
      webSiteObjectTreeId: {
        type: 'string',
        title: 'Web Site Template',
        default: '',
        required: true,
        oneOfTree: [
          {
            treeType: 'WebSiteTemplate',
            namespaceName: 'templates',
            namespaceType: 'RepositoryCategory',
            ownerName: 'public',
            ownerType: 'Repository',
          },
          {
            treeType: 'WebSiteTemplate',
          },
        ],
      },
    },
  },
};

export const WEB_SITE_VIEW_WITH_MENU_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteViewWithMenu',
  inheritedTypesIds: [WEB_SITE_VIEW_TYPE.name],
  definition: {
    properties: {
      menuTitle: {
        type: 'string',
        title: 'Menu title',
        default: '',
        required: true,
      },
      menuEntries: {
        type: 'object',
        title: 'Menu entries',
        properties: {},
      },
      webSiteObjectTreeId: {
        type: 'string',
        title: 'Web Site Template',
        default: '',
        required: true,
        oneOfTree: [
          {
            treeType: 'WebSiteWitHMenuTemplate',
            namespaceName: 'templates',
            namespaceType: 'RepositoryCategory',
            ownerName: 'public',
            ownerType: 'Repository',
          },
          {
            treeType: 'WebSiteWitHMenuTemplate',
          },
        ],
      },
    },
  },
};

export const PAGE_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'PageTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const WEB_SITE_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteTemplate',
  inheritedTypesIds: [
    TEMPLATE_VIEW_TYPE.name,
    TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE.name,
  ],
  definition: {
    properties: {
      pageObjectTreeId: {
        title: 'Page template',
        type: 'string',
        oneOfTree: [
          {
            treeType: PAGE_TEMPLATE_TYPE.name,
            namespaceName: TEMPLATES_OBJECT_NAME,
            namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
            ownerName: PUBLIC_OBJECT_NAME,
            ownerType: ObjectTypeName.REPOSITORY,
          },
          {
            treeType: PAGE_TEMPLATE_TYPE.name,
          },
        ],
      },
    },
  },
  contentType: '',
};

export const MENU_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'MenuTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const WEB_SITE_WITH_PAGES_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteWitHPagesTemplate',
  inheritedTypesIds: [WEB_SITE_TEMPLATE_TYPE.name],
  definition: {
    properties: {
      pageTemplateChoices: {
        title: 'Page templates choice',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pageTypeKey: {
              type: 'string',
              title: 'Page type key',
            },
            pageTypeName: {
              type: 'string',
              title: 'Page type name',
            },
            pageObjectTreeId: {
              title: 'Page template',
              type: 'string',
              oneOfTree: [
                {
                  treeType: PAGE_TEMPLATE_TYPE.name,
                  namespaceName: TEMPLATES_OBJECT_NAME,
                  namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
                  ownerName: PUBLIC_OBJECT_NAME,
                  ownerType: ObjectTypeName.REPOSITORY,
                },
                {
                  treeType: PAGE_TEMPLATE_TYPE.name,
                },
              ],
            },
            pageTypes: {
              type: 'array',
              title: 'Page types',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  contentType: '',
};

export const WEB_SITE_WITH_MENU_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteWitHMenuTemplate',
  inheritedTypesIds: [WEB_SITE_TEMPLATE_TYPE.name],
  definition: {
    properties: {
      menuObjectTreeId: {
        title: 'Menu template',
        type: 'string',
        oneOfTree: [
          {
            treeType: MENU_TEMPLATE_TYPE.name,
            namespaceName: TEMPLATES_OBJECT_NAME,
            namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
            ownerName: PUBLIC_OBJECT_NAME,
            ownerType: ObjectTypeName.REPOSITORY,
          },
          {
            treeType: MENU_TEMPLATE_TYPE.name,
          },
        ],
      },
      menuEntries: {
        type: 'array',
        title: 'Menu entries',
        items: {
          type: 'object',
          properties: {
            entryKey: {
              type: 'string',
              title: 'Entry key',
            },
            entryName: {
              type: 'string',
              title: 'Entry name',
            },
            menuEntryLabelKey: {
              type: 'string',
              title: 'Menu entry label key',
              default: 'name',
            },
            entryTypes: {
              type: 'array',
              title: 'Entry types',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  },
  contentType: '',
};

export const CATEGORY_MENU_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: MENU_TEMPLATE_TYPE.name,
  name: MENU_TEMPLATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};

export const CATEGORY_PAGE_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: PAGE_TEMPLATE_TYPE.name,
  name: PAGE_TEMPLATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};

export const PAGE_TYPE: ObjectTypeDefinition = {
  name: 'Page',
  definition: {
    properties: {
      pageTitle: {
        title: 'Page title',
        type: 'string',
      },
    },
  },
  contentType: 'ContentText',
};

export const PAGE_WITH_SUB_PAGE: ObjectTypeDefinition = {
  name: 'PageWithSubPage',
};

export const WELCOME_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'WelcomePage',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {},
  },
};

export const PAGE_WITH_TEMPLATE_CHOICE: ObjectTypeDefinition = {
  name: 'PageWithTemplateChoice',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      pageTemplateChoice: {
        title: 'Display choice',
        type: 'string',
      },
    },
  },
};

export const WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: WEB_SITE_VIEW_TYPE.name,
  subTypeName: WELCOME_PAGE_TYPE.name,
  name: 'Welcome page',
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
  min: 1,
  max: 1,
};

export const MENU_ENTRY_TYPE: ObjectTypeDefinition = {
  name: 'MenuEntry',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      menuTitle: {
        title: 'Menu entry label',
        type: 'string',
      },
    },
  },
  contentType: '',
};

export const CALENDAR_ENTRY_TYPE: ObjectTypeDefinition = {
  name: 'CalendarEntry',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      calendarDate: {
        title: 'Date',
        type: 'string',
      },
    },
  },
  contentType: '',
};
