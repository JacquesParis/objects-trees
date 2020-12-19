import {ObjectTypeDefinition} from '../../integration/extension.provider';
import {IMAGE_GALLERY_SELECTOR_TYPE} from './../content-image/content-image.const';

export const POST_NAME = 'PostType';

export const POST_TYPE: ObjectTypeDefinition = {
  name: 'Post',
  definition: {
    properties: {},
  },
  contentType: 'ContentText',
};

/*
export const TEXT_TYPE: ObjectTypeDefinition = {
  name: 'Text',
  definition: {
    properties: {},
  },
  contentType: ContentT,
};*/

/*
export const POST_TEXT_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: POST_TYPE.name,
  subTypeName: TEXT_TYPE.name,
  name: TEXT_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};*/
/*
export const POST_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'PostWithMenu',
  inheritedTypesIds: [POST_TYPE.name, PAGE_TYPE.name],
};
*/
/*
export const POST_WITH_MENU_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: POST_WITH_MENU_TYPE.name,
  subTypeName: MENU_TYPE.name,
  name: MENU_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
  max: 1,
};*/
/*
export const POST_WITH_DATE_TYPE: ObjectTypeDefinition = {
  name: 'PostWithDate',
  inheritedTypesIds: [POST_TYPE.name, DATE_TYPE.name],
};*/
/*
export const POST_WITH_DATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: POST_WITH_DATE_TYPE.name,
  subTypeName: DATE_TYPE.name,
  name: DATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
  max: 1,
};
*/
export const POST_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'PostWithGallery',
  inheritedTypesIds: [POST_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};
/*
export const POST_WITH_GALLERY_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: POST_WITH_GALLERY_TYPE.name,
  subTypeName: GALLERY_TYPE.name,
  name: GALLERY_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: false,
};
*/
