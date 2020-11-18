import {ObjectSubTypeDefintion} from './../../../integration/object-types/object-type.provider';
import {ObjectTypeName} from './../../../services/application.service';
export const TRAVEL_STORY_NAME = 'TravelStoryType';

export const TRAVEL_STORY_TYPE = {
  name: 'TravelStoryType',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_POST_TYPE = {
  name: 'TravelStoryPost',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_TEXT_TYPE = {
  name: 'TravelStoryText',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_GALLERY_TYPE = {
  name: 'TravelStoryGallery',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_MENU_TYPE = {
  name: 'TravelStoryMenu',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TRAVEL_STORY_DATE_TYPE = {
  name: 'TravelStoryDate',
  definition: {
    properties: {},
  },
  contentType: '',
};

export const TENANT_TRAVEL_STORY_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: ObjectTypeName.TENANT,
  subTypeName: TRAVEL_STORY_TYPE.name,
  name: TRAVEL_STORY_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};

export const TRAVEL_STORY_TRAVEL_STORY_POST_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: TRAVEL_STORY_TYPE.name,
  subTypeName: TRAVEL_STORY_POST_TYPE.name,
  name: TRAVEL_STORY_POST_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_TEXT_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_TEXT_TYPE.name,
  name: TRAVEL_STORY_TEXT_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_MENU_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_MENU_TYPE.name,
  name: TRAVEL_STORY_MENU_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
  max: 1,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_DATE_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_DATE_TYPE.name,
  name: TRAVEL_STORY_DATE_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
  max: 1,
};

export const TRAVEL_STORY_POST_TRAVEL_STORY_GALLERY_SUBTYPE: Partial<ObjectSubTypeDefintion> = {
  typeName: TRAVEL_STORY_POST_TYPE.name,
  subTypeName: TRAVEL_STORY_GALLERY_TYPE.name,
  name: TRAVEL_STORY_GALLERY_TYPE.name,
  acl: true,
  namespace: true,
  owner: false,
  tree: true,
};
