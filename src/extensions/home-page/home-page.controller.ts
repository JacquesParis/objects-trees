import {inject, service} from '@loopback/core';
import {get, param, Response, RestBindings} from '@loopback/rest';
import {GeneratedResponse} from '../../helper/generated-response';
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
  @get('/page/{name}')
  async getWebSitePageResponse(
    @param.path.string('name') name: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
    @inject(CURRENT_CONTEXT) ctx: CurrentContext,
  ): Promise<Response> {
    const generatedView: GeneratedResponse = await this.homePageService.getWebSitePageResponse(
      name,
      ctx,
    );
    return generatedView.getResponse(response);
  }
}
