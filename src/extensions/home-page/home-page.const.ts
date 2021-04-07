import {ObjectTypeDefinition} from '../../integration/extension.provider';
import {ObjectSubTypeDefinition} from './../../integration/extension.provider';
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
  templateView:
    '<span class="child-tree-preview">http://{{dataNode.host}}{{#dataNode.path}}/site/{{dataNode.path}}{{/dataNode.path}}</span>',
  iconView: 'fas fa-globe-europe',
};

export const WEB_SITE_CACHE_LANG_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteCacheLang',
  templateView: '<span class="child-tree-preview">{{dataNode.name}}</span>',
  iconView: 'far fa-flag',
  forcedAccessRights: {create: false, update: false},
};

export const PAGE_CACHE_TYPE: ObjectTypeDefinition = {
  name: 'PageCache',
  contentType: 'ContentPageCache',
  forcedAccessRights: {create: false, update: false},
  definition: {
    properties: {
      name: {
        type: 'string',
        'x-schema-form': {
          condition: 'false',
        },
        required: false,
      },
      pageUrl: {
        type: 'string',
        title: 'Page url',
      },
    },
  },
  templateView: '<span class="child-tree-preview">{{dataNode.pageUrl}}</span>',
  iconView: 'fas fa-database',
};

export const WEB_SITE_VIEW_WEB_SITE_VIEW_URL_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: WEB_SITE_VIEW_TYPE.name,
  subTypeName: WEB_SITE_VIEW_URL_TYPE.name,
  owner: true,
};

export const WEB_SITE_VIEW_URL_WEB_SITE_CACHE_LANG_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: WEB_SITE_VIEW_URL_TYPE.name,
  subTypeName: WEB_SITE_CACHE_LANG_TYPE.name,
  namespace: true,
};

export const WEB_SITE_CACHE_LANG_PAGE_CACHE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: WEB_SITE_CACHE_LANG_TYPE.name,
  subTypeName: PAGE_CACHE_TYPE.name,
};
