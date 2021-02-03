import {ObjectTypeDefinition} from '../../integration/extension.provider';
import {ObjectSubTypeDefintion} from './../../integration/extension.provider';
import {WEB_SITE_VIEW_TYPE} from './../web-site/web-site.const';
export const HOME_PAGE_PROVIDER = 'HomePageProvider';

export const WEB_SITE_VIEW_URL_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteViewUrl',
  definition: {
    properties: {
      name: {
        type: 'string',
        'x-schema-form': {
          condition: 'false',
        },
        required: false,
      },
      host: {
        type: 'string',
        title: 'Web site domain',
        required: true,
      },
      path: {
        type: 'string',
        title: 'Web site path',
        description:
          'An option path after /site like http://&lt;Web site domain&gt;/site/&lt;Web site path&gt;',
      },
    },
  },
};

export const PAGE_CACHE_TYPE: ObjectTypeDefinition = {
  name: 'PageCache',
  contentType: 'ContentPageCache',
};

export const WEB_SITE_VIEW_WEB_SITE_VIEW_URL_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: WEB_SITE_VIEW_TYPE.name,
  subTypeName: WEB_SITE_VIEW_URL_TYPE.name,
  owner: true,
};

export const WEB_SITE_VIEW_URL_PAGE_CACHE_SUBTYPE: ObjectSubTypeDefintion = {
  typeName: WEB_SITE_VIEW_URL_TYPE.name,
  subTypeName: PAGE_CACHE_TYPE.name,
};
