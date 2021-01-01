import {REPOSITORY_CATEGORY_TYPE} from '../../services';
import {IMAGE_GALLERY_SELECTOR_TYPE} from '../content-image/content-image.const';
import {
  ObjectSubTypeDefintion,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {TEMPLATE_VIEW_TYPE} from './../content-generic-template/content-generic-template.const';
import {PAGE_TYPE, PARAGRAPH_TYPE} from './../web-site/web-site.const';
export const CONTENT_IMAGE_TEMPLATE_PROVIDER = 'ContentImageTemplateProvider';
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

export const PARAGRAPH_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'ParagraphWithGallery',
  inheritedTypesIds: [PARAGRAPH_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};

export const PAGE_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'PageWithGallery',
  inheritedTypesIds: [PAGE_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};
