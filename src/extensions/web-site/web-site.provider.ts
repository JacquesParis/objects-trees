import {ObjectTreesApplicationInterface} from '../../application';
import {contentGenericTemplate} from '../../helper';
import {ExtensionProvider} from '../../integration/extension.provider';
import {TransientUriReferenceProvider} from '../../services/inside-rest/transient-uri-reference.provider';
import {ContentGenericTemplateProvider} from '../content-generic-template/content-generic-template.provider';
import {UriCompleteProvider} from './../../services/uri-complete/uri-complete.provider';
import {TransientWebSiteService} from './transient-web-site.service';
import {
  CALENDAR_ENTRY_TYPE,
  CATEGORY_MENU_TEMPLATE_SUBTYPE,
  CATEGORY_PAGE_TEMPLATE_SUBTYPE,
  CATEGORY_PARAGRAPH_TEMPLATE_SUBTYPE,
  MENU_ENTRY_TYPE,
  MENU_TEMPLATE_TYPE,
  PAGE_TEMPLATE_TYPE,
  PAGE_TYPE,
  PAGE_WITH_PARAGRAPH_TYPE,
  PAGE_WITH_SUB_PAGE_TYPE,
  PAGE_WITH_TEMPLATE_CHOICE,
  PARAGRAPH_TEMPLATE_TYPE,
  PARAGRAPH_TYPE,
  PARAGRAPH_WITH_TEMPLATE_CHOICE,
  WEB_SITE_PROVIDER,
  WEB_SITE_TEMPLATE_TYPE,
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
  WEB_SITE_WITH_PAGES_TEMPLATE_TYPE,
  WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site.const';
export class WebSiteProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(WEB_SITE_PROVIDER, app);
    this.requiredProviders.push(
      UriCompleteProvider,
      TransientUriReferenceProvider,
      ContentGenericTemplateProvider,
    );

    this.objectTypes.push(
      WEB_SITE_TEMPLATE_TYPE,
      WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
      WEB_SITE_WITH_PAGES_TEMPLATE_TYPE,
      WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE,
      WEB_SITE_VIEW_TYPE,
      WEB_SITE_VIEW_WITH_MENU_TYPE,
      MENU_TEMPLATE_TYPE,
      PAGE_TEMPLATE_TYPE,
      PARAGRAPH_TEMPLATE_TYPE,
      PAGE_TYPE,
      PAGE_WITH_PARAGRAPH_TYPE,
      PARAGRAPH_TYPE,
      PAGE_WITH_TEMPLATE_CHOICE,
      PARAGRAPH_WITH_TEMPLATE_CHOICE,
      WELCOME_PAGE_TYPE,
      CALENDAR_ENTRY_TYPE,
      MENU_ENTRY_TYPE,
      PAGE_WITH_SUB_PAGE_TYPE,
    );
    this.objectSubTypes.push(
      CATEGORY_MENU_TEMPLATE_SUBTYPE,
      WEB_SITE_VIEW_WELCOME_PAGE_SUBTYPE,
      CATEGORY_PAGE_TEMPLATE_SUBTYPE,
      CATEGORY_PARAGRAPH_TEMPLATE_SUBTYPE,
    );

    this.services.push({cls: TransientWebSiteService});

    this.objectTrees.navBar = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'navBar',
      treeNodeTypeId: MENU_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'navBar'),
        },
        children: {},
      },
    };

    this.objectTrees.card = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'card',
      treeNodeTypeId: PARAGRAPH_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'card'),
        },
        children: {},
      },
    };

    this.objectTrees.pageWithParagraph = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'pageWithParagraph',
      treeNodeTypeId: PAGE_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(
            __dirname,
            'pageWithParagraph',
          ),
        },
        children: {},
      },
    };
  }
}
