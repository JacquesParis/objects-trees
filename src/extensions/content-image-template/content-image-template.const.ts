import {REPOSITORY_CATEGORY_TYPE} from '../../services';
import {IMAGE_GALLERY_SELECTOR_TYPE} from '../content-image/content-image.const';
import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {TEMPLATE_VIEW_TYPE} from './../content-generic-template/content-generic-template.const';
import {
  PAGE_TYPE,
  PAGE_WITH_PARAGRAPH_TYPE,
  PARAGRAPH_CONTAINER_TYPE,
  PARAGRAPH_TYPE,
  TEXT_PARAGRAPH_TYPE,
  WEB_SITE_VIEW_WITH_POPUP,
} from './../web-site/web-site.const';
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

export const CATEGORY_IMAGE_GALLERY_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: IMAGE_GALLERY_TEMPLATE_TYPE.name,
  name: IMAGE_GALLERY_TEMPLATE_TYPE.name,
  tree: true,
};

export const GALLERY_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  name: 'GalleryParagraph',
  inheritedTypesIds: [PARAGRAPH_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};

export const GALLERY_TEXT_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  name: 'GalleryTextParagraph',
  inheritedTypesIds: [TEXT_PARAGRAPH_TYPE.name, GALLERY_PARAGRAPH_TYPE.name],
};

export const PAGE_WITH_GALLERY_TYPE: ObjectTypeDefinition = {
  name: 'PageWithGallery',
  inheritedTypesIds: [PAGE_TYPE.name, IMAGE_GALLERY_SELECTOR_TYPE.name],
};

export const PAGE_WITH_GALLERY_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  name: 'PageWithGalleryParagraph',
};

export const PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE: ObjectTypeDefinition = {
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  name: 'PageWithGalleryTextParagraph',
};

export const WEB_SITE_VIEW_WITH_IMAGE_IN_POPUP: ObjectTypeDefinition = {
  name: 'WebSiteViewWithImageInPopup',
  inheritedTypesIds: [WEB_SITE_VIEW_WITH_POPUP.name],
  definition: {
    properties: {
      popupLinkLabels: {
        properties: {
          galleryLinkLabel: {
            type: 'string',
            title: 'Popup gallery link label',
            default: 'Navigate to gallery',
          },
        },
      },
    },
  },
};

export const PAGE_WITH_GALLERY_PARAGRAPH_GALLERY_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PAGE_WITH_GALLERY_PARAGRAPH_TYPE.name,
  subTypeName: GALLERY_PARAGRAPH_TYPE.name,
};

export const PAGE_WITH_GALLERY_TEXT_PARAGRAPH_GALLERY_TEXT_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PAGE_WITH_GALLERY_TEXT_PARAGRAPH_TYPE.name,
  subTypeName: GALLERY_TEXT_PARAGRAPH_TYPE.name,
};

export const PARAGRAPH_CONTAINER_GALLERY_TEXT_PARAGRAPH_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: PARAGRAPH_CONTAINER_TYPE.name,
  subTypeName: GALLERY_TEXT_PARAGRAPH_TYPE.name,
};
