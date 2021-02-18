import {
  ObjectSubTypeDefinition,
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

export const ADMIN_ENTRY_TYPE: ObjectTypeDefinition = {
  name: 'AdminEntry',
  definition: {
    properties: {adminTitle: {type: 'string', title: 'Admin menu label'}},
  },
};

export const WEB_SITE_VIEW_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteView',
  inheritedTypesIds: [
    TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE.name,
    ADMIN_ENTRY_TYPE.name,
  ],
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
  iconView: 'fas fa-globe',
};

export const WEB_SITE_MENU_ENTRIES_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteMenuEntries',
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

export const PARAGRAPH_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'ParagraphTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const PAGE_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'PageTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name, PARAGRAPH_TEMPLATE_TYPE.name],
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
      pageTemplateObjectTreeId: {
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
      paragraphTemplateObjectTreeId: {
        title: 'Paragraph template',
        type: 'string',
        oneOfTree: [
          {
            treeType: PARAGRAPH_TEMPLATE_TYPE.name,
            namespaceName: TEMPLATES_OBJECT_NAME,
            namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
            ownerName: PUBLIC_OBJECT_NAME,
            ownerType: ObjectTypeName.REPOSITORY,
          },
          {
            treeType: PARAGRAPH_TEMPLATE_TYPE.name,
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
            pageTemplateObjectTreeId: {
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

export const WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteWitHParagraphsTemplate',
  inheritedTypesIds: [WEB_SITE_TEMPLATE_TYPE.name],
  definition: {
    properties: {
      paragraphTemplateChoices: {
        title: 'Paragraph templates choice',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            paragraphTypeKey: {
              type: 'string',
              title: 'Paragraph type key',
            },
            paragraphTypeName: {
              type: 'string',
              title: 'Paragraph type name',
            },
            paragraphTemplateObjectTreeId: {
              title: 'Paragraph template',
              type: 'string',
              oneOfTree: [
                {
                  treeType: PARAGRAPH_TEMPLATE_TYPE.name,
                  namespaceName: TEMPLATES_OBJECT_NAME,
                  namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
                  ownerName: PUBLIC_OBJECT_NAME,
                  ownerType: ObjectTypeName.REPOSITORY,
                },
                {
                  treeType: PARAGRAPH_TEMPLATE_TYPE.name,
                },
              ],
            },
            paragraphTypes: {
              type: 'array',
              title: 'Paragraph types',
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
            adminEntry: {
              type: 'boolean',
              title: 'Redirect to the admin tool',
              default: false,
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

export const PAGE_TYPE: ObjectTypeDefinition = {
  name: 'Page',
  inheritedTypesIds: [],
  definition: {
    properties: {
      pageTitle: {
        title: 'Page title',
        type: 'string',
      },
    },
  },
  contentType: 'ContentText',
  iconView: 'far fa-file-alt',
};

export const PARAGRAPH_TYPE: ObjectTypeDefinition = {
  name: 'Paragraph',
  definition: {
    properties: {
      paragraphTitle: {
        title: 'Paragraph title',
        type: 'string',
      },
    },
  },
  contentType: '',
};

export const PARAGRAPH_WITH_PAGE_LINK: ObjectTypeDefinition = {
  name: 'ParagraphWithPageLink',
  definition: {
    properties: {
      linkedPageObjectTreeId: {
        title: 'Linked page',
        type: 'string',
        oneOfNode: [
          {
            nodeType: PAGE_TYPE.name,
          },
        ],
      },
    },
  },
};

export const TEXT_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PARAGRAPH_TYPE.name],
  name: 'TextParagraph',
  definition: {
    properties: {},
  },
  contentType: 'ContentText',
  iconView: 'fas fa-align-left',
};

export const PARAGRAPH_CONTAINER_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [],
  name: 'ParagraphContainer',
};

export const SECTION_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PARAGRAPH_TYPE.name, PARAGRAPH_CONTAINER_TYPE.name],
  name: 'SectionParagraph',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const PAGE_WITH_SUB_PAGE_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_TYPE.name],
  name: 'PageWithSubPage',
};

export const PAGE_WITH_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_TYPE.name],
  name: 'PageWithParagraph',
};

export const PAGE_WITH_TEXT_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  name: 'PageWithTextParagraph',
};

export const PAGE_WITH_SECTION_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  name: 'PageWithSectionParagraph',
};

export const WELCOME_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'WelcomePage',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {},
  },
  iconView: 'fas fa-door-open',
};

export const PAGE_WITH_TEMPLATE_CHOICE: ObjectTypeDefinition = {
  name: 'PageWithTemplateChoice',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      pageTemplateChoice: {
        title: 'Page display choice',
        type: 'string',
      },
    },
  },
};

export const PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE: ObjectTypeDefinition = {
  name: 'ParagraphWithTemplateChoice',
  inheritedTypesIds: [PARAGRAPH_TYPE.name],
  definition: {
    properties: {
      paragraphTemplateChoice: {
        title: 'Paragraph display choice',
        type: 'string',
      },
    },
  },
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
  iconView: 'fas fa-bars',
};

export const CATEGORY_MENU_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: MENU_TEMPLATE_TYPE.name,
  tree: true,
};

export const PAGE_WITH_TEXT_PARAGRAPH_TEXT_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PAGE_WITH_TEXT_PARAGRAPH_TYPE.name,
  subTypeName: TEXT_PARAGRAPH_TYPE.name,
};

export const PARAGRAPH_CONTAINER_TEXT_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PARAGRAPH_CONTAINER_TYPE.name,
  subTypeName: TEXT_PARAGRAPH_TYPE.name,
};

export const PAGE_WITH_SECTION_PARAGRAPH_SECTION_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PAGE_WITH_SECTION_PARAGRAPH_TYPE.name,
  subTypeName: SECTION_PARAGRAPH_TYPE.name,
};

export const CATEGORY_PAGE_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: PAGE_TEMPLATE_TYPE.name,
  tree: true,
};

export const CATEGORY_PARAGRAPH_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: PARAGRAPH_TEMPLATE_TYPE.name,
  tree: true,
};

export const WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: WEB_SITE_VIEW_TYPE.name,
  subTypeName: WELCOME_PAGE_TYPE.name,
  min: 1,
  max: 1,
};
