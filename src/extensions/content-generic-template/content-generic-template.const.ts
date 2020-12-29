import {ObjectTypeDefinition} from './../../integration/extension.provider';

export const CONTENT_GENERIC_PROVIDER = 'ContentGenericProvider';
export const CONTENT_GENERIC_TEMPLATE = 'ContentGenericTemplate';

export const TEMPLATE_VIEW_TYPE: ObjectTypeDefinition = {
  name: 'TemplateView',
  contentType: 'ContentGenericTemplate',
  definition: {
    properties: {},
  },
};

export const TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE: ObjectTypeDefinition = {
  name: 'TemplateRefererWithConfiguration',
  definition: {
    properties: {
      templatesConfigurations: {
        type: 'object',
        title: 'Templates configurations',
        properties: {},
      },
    },
  },
};
