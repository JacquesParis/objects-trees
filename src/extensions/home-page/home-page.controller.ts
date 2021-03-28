import {inject, service} from '@loopback/core';
import {get, param, Response, RestBindings} from '@loopback/rest';
import {GeneratedResponse} from '../../helper/generated-response';
import {RedirectGeneratedResponse} from './../../helper/generated-response';
import {
  CurrentContext,
  CURRENT_CONTEXT,
} from './../../services/application.service';
import {HomePageService} from './home-page.service';

export class HomePageController {
  constructor(
    @service(HomePageService)
    public homePageService: HomePageService,
  ) {}

  @get('/admin/')
  async getAdminPage(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    if ('/admin' === ctx.uriContext.uri.value.path) {
      const generatedView: GeneratedResponse = new RedirectGeneratedResponse(
        ctx.uriContext.uri.value.baseUri + '/admin/',
      );
      return generatedView.getResponse(response);
    }
    const generatedView: GeneratedResponse = await this.homePageService.renderAdminPage(
      undefined,
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/admin/{any}')
  async getAdminPageBis(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.renderAdminPage(
      undefined,
      ctx,
    );
    return generatedView.getResponse(response);
  }

  @get('/site/{siteName}')
  async getLoadingPageOfSite(
    @param.path.string('siteName') siteName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getLoadingPageResponse(
      ctx,
      undefined,
      siteName,
    );
    return generatedView.getResponse(response);
  }
  @get('/site/{siteName}/{lang}')
  async getLoadingLangPageOfSite(
    @param.path.string('siteName') siteName: string,
    @param.path.string('lang') lang: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getLoadingPageResponse(
      ctx,
      lang,
      siteName,
    );
    return generatedView.getResponse(response);
  }
  @get('/site/{siteName}/{lang}/{name}')
  async getWebSitePageOfSiteResponse(
    @param.path.string('siteName') siteName: string,
    @param.path.string('lang') lang: string,
    @param.path.string('name') name: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getWebSitePageResponse(
      lang,
      name,
      ctx,
      siteName,
    );
    return generatedView.getResponse(response);
  }

  @get('/site/{siteName}/{lang}/{name}/popup')
  async getWebSitePopupOfSiteResponse(
    @param.path.string('siteName') siteName: string,
    @param.path.string('lang') lang: string,
    @param.path.string('name') name: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getWebSitePopupResponse(
      lang,
      name,
      ctx,
      siteName,
    );
    return generatedView.getResponse(response);
  }

  @get('/')
  async getLoadingPage(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getLoadingPageResponse(
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/favicon.png')
  async getFavicon(
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getFavicon(
      ctx,
    );
    return generatedView.getResponse(response);
  }
  @get('/{lang}')
  async getLoadingLangPage(
    @param.path.string('lang') lang: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getLoadingPageResponse(
      ctx,
      lang,
    );
    return generatedView.getResponse(response);
  }

  @get('/{lang}/{name}')
  async getWebSitePageResponse(
    @param.path.string('lang') lang: string,
    @param.path.string('name') name: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getWebSitePageResponse(
      lang,
      name,
      ctx,
    );
    return generatedView.getResponse(response);
  }

  @get('/{lang}/{name}/popup')
  async getWebSitePopupResponse(
    @param.path.string('lang') lang: string,
    @param.path.string('name') name: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getWebSitePopupResponse(
      lang,
      name,
      ctx,
    );
    return generatedView.getResponse(response);
  }
}
