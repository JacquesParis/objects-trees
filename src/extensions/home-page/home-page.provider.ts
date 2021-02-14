import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {WebSiteProvider} from './../web-site/web-site.provider';
import {
  ContentPageCache,
  ContentPageCacheRepository,
  ContentPageCacheService,
  PageCache,
} from './content-page-cache.definition';
import {
  HOME_PAGE_PROVIDER,
  PAGE_CACHE_TYPE,
  WEB_SITE_CACHE_LANG_PAGE_CACHE_SUBTYPE,
  WEB_SITE_CACHE_LANG_TYPE,
  WEB_SITE_VIEW_URL_PAGE_CACHE_SUBTYPE,
  WEB_SITE_VIEW_URL_TYPE,
  WEB_SITE_VIEW_URL_WEB_SITE_CACHE_LANG_SUBTYPE,
  WEB_SITE_VIEW_WEB_SITE_VIEW_URL_SUBTYPE,
} from './home-page.const';
import {HomePageController} from './home-page.controller';
import {HomePageService} from './home-page.service';

export class HomePageProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(HOME_PAGE_PROVIDER, app);
    this.requiredProviders.push(WebSiteProvider);

    this.models.push(PageCache);
    this.models.push(ContentPageCache);
    this.repositories.push({repoClass: ContentPageCacheRepository});

    this.services.push({cls: ContentPageCacheService});
    this.services.push({cls: HomePageService});
    this.controllers.push({
      controllerCtor: HomePageController,
      description: {
        description: 'Render web site home page',
        services: ['HomePageService'],
      },
    });
    this.objectTypes.push(
      WEB_SITE_VIEW_URL_TYPE,
      WEB_SITE_CACHE_LANG_TYPE,
      PAGE_CACHE_TYPE,
    );
    this.objectSubTypes.push(
      WEB_SITE_VIEW_WEB_SITE_VIEW_URL_SUBTYPE,
      WEB_SITE_VIEW_URL_PAGE_CACHE_SUBTYPE,
      WEB_SITE_VIEW_URL_WEB_SITE_CACHE_LANG_SUBTYPE,
      WEB_SITE_CACHE_LANG_PAGE_CACHE_SUBTYPE,
    );
  }
}
