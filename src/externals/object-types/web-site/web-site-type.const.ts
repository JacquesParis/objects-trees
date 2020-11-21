import {ObjectTypeDefinition} from './../../../integration/object-types/object-type.provider';
export const WEB_SITE_NAME = 'WebSiteType';

export const TEMPLATE_VIEW_TYPE: ObjectTypeDefinition = {
  name: 'TemplateView',
  definition: {
    properties: {
      template: {
        type: 'string',
        title: 'Template',
        default: '',
        required: true,
      },
    },
  },
};

export const WEB_SITE_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteTemplate',
  inheritedTypesIds: ['TemplateView'],
  definition: {
    properties: {},
  },
  contentType: '',
};
