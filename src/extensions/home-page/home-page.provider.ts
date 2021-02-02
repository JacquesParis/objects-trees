import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {WebSiteProvider} from './../web-site/web-site.provider';
import {
  HOME_PAGE_PROVIDER,
  WEB_SITE_VIEW_URL_TYPE,
  WEB_SITE_VIEW_WEB_SITE_URL_SUBTYPE,
} from './home-page.const';
import {HomePageController} from './home-page.controller';
import {HomePageService} from './home-page.service';

export class HomePageProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(HOME_PAGE_PROVIDER, app);
    this.requiredProviders.push(WebSiteProvider);
    this.services.push({cls: HomePageService});
    this.controllers.push({
      controllerCtor: HomePageController,
      description: {
        description: 'Render web site home page',
        services: ['HomePageService'],
      },
    });
    this.objectTypes.push(WEB_SITE_VIEW_URL_TYPE);
    this.objectSubTypes.push(WEB_SITE_VIEW_WEB_SITE_URL_SUBTYPE);
  }
}
