import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from '../../integration/extension.provider';
import {ObjectTypeName} from '../../services/application.service';
import {CATEGORY_TYPE} from '../../services/object-tree/object-tree.const';
import {
  POST_TYPE,
  POST_WITH_DATE_TYPE,
  POST_WITH_GALLERY_TYPE,
  POST_WITH_MENU_TYPE,
} from '../post/post-type.const';
import {WEB_SITE_TEMPLATE_TYPE} from './../web-site/web-site-type.const';
export const TRAVEL_STORY_NAME = 'TravelStoryType';

export const TRAVEL_STORY_TYPE: ObjectTypeDefinition = {
  name: 'TravelStory',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_POST_TYPE: ObjectTypeDefinition = {
  name: 'TravelStoryPost',
  inheritedTypesIds: [
    POST_TYPE.name,
    POST_WITH_DATE_TYPE.name,
    POST_WITH_MENU_TYPE.name,
    POST_WITH_GALLERY_TYPE.name,
  ],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_TEMPLATE_TYPE = {
  name: 'TravelStoryTemplate',
  inheritedTypesIds: [WEB_SITE_TEMPLATE_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TENANT_TRAVEL_STORY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: ObjectTypeName.TENANT,
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

export const CATEGORY_TRAVEL_STORY_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: CATEGORY_TYPE.name,
  subTypeName: TRAVEL_STORY_TEMPLATE_TYPE.name,
  name: TRAVEL_STORY_TEMPLATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};
