import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from '../../integration/extension.provider';
import {ObjectTypeName} from '../../services/application.service';
import {
  FOLDER_TYPE,
  REPOSITORY_CATEGORY_TYPE,
} from '../../services/object-tree/object-tree.const';
import {POST_TYPE, POST_WITH_GALLERY_TYPE} from '../post/post-type.const';
import {
  PUBLIC_OBJECT_NAME,
  TEMPLATES_OBJECT_NAME,
} from './../../services/object-tree/object-tree.const';
import {
  CALENDAR_ENTRY_TYPE,
  MENU_ENTRY_TYPE,
  PAGE_TYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
} from './../web-site/web-site-type.const';
export const TRAVEL_STORY_NAME = 'TravelStoryType';

export const TRAVEL_STORY_TEMPLATE_TYPE = {
  name: 'TravelStoryTemplate',
  inheritedTypesIds: [WEB_SITE_WITH_MENU_TEMPLATE_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_TYPE: ObjectTypeDefinition = {
  name: 'TravelStory',
  inheritedTypesIds: [WEB_SITE_VIEW_WITH_MENU_TYPE.name],
  definition: {
    properties: {
      webSiteObjectTreeId: {
        type: 'string',
        oneOfTree: [
          {
            treeType: TRAVEL_STORY_TEMPLATE_TYPE.name,
            namespaceName: TEMPLATES_OBJECT_NAME,
            namespaceType: ObjectTypeName.REPOSITORY_CATEGORY,
            ownerName: PUBLIC_OBJECT_NAME,
            ownerType: ObjectTypeName.REPOSITORY,
          },
          {
            treeType: 'TravelStoryTemplate',
          },
        ],
      },
    },
  },
  contentType: '',
};

export const TRAVEL_STORY_POST_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryPost',
  inheritedTypesIds: [
    POST_TYPE.name,
    MENU_ENTRY_TYPE.name,
    PAGE_TYPE.name,
    CALENDAR_ENTRY_TYPE.name,
    POST_WITH_GALLERY_TYPE.name,
  ],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const FOLDER_TRAVEL_STORY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: FOLDER_TYPE.name,
  subTypeName: TRAVEL_STORY_TYPE.name,
  name: TRAVEL_STORY_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};

export const TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_TYPE.name,
  subTypeName: TRAVEL_STORY_POST_TYPE.name,
  name: TRAVEL_STORY_POST_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_POST_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_POST_TYPE.name,
  name: TRAVEL_STORY_POST_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};

export const CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: TRAVEL_STORY_TEMPLATE_TYPE.name,
  name: TRAVEL_STORY_TEMPLATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};
