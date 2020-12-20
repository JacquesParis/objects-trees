import {REPOSITORY_CATEGORY_TYPE} from '../../services';
import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {TEMPLATE_VIEW_TYPE} from './../content-generic-template/content-generic-template.const';
export const CONTENT_IMAGE_TEMPLATE = 'ContentImageTemplateService';

export const IMAGE_GALLERY_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'ImageGalleryTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
};

export const CATEGORY_IMAGE_GALLERY_TEMPLATE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: IMAGE_GALLERY_TEMPLATE_TYPE.name,
  name: IMAGE_GALLERY_TEMPLATE_TYPE.name,
  acl: false,
  namespace: false,
  owner: false,
  tree: true,
};
