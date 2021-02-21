import {IObjectTree, IRestEntity} from '@jacquesparis/objects-model';
import {AjaxResult} from '@jacquesparis/objects-website';
import {service} from '@loopback/core';
import {
  GeneratedResponse,
  JsonGeneratedResponse,
} from '../../helper/generated-response';
import {EntityName} from '../../models';
import {CurrentContext} from '../../services';
import {ApplicationError} from './../../helper/application-error';
import {
  HtmlGeneratedResponse,
  RedirectGeneratedResponse,
} from './../../helper/generated-response';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {
  EntityActionType,
  ExpectedValue,
} from './../../services/application.service';
import {ContentEntityService} from './../../services/content-entity/content-entity.service';
import {NodeInterceptService} from './../../services/entity-intercept/node-intercept.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TENANT_TYPE} from './../../services/object-tree/object-tree.const';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {TRAVEL_STORY_TYPE} from './../travel-story/travel-story-type.const';
import {ActionWebSiteService} from './../web-site/action-web-site.service';
import {PAGE_TYPE} from './../web-site/web-site.const';
import {Popup} from './../web-site/web-site.interface';
import {
  HOME_PAGE_PROVIDER,
  PAGE_CACHE_TYPE,
  WEB_SITE_CACHE_LANG_TYPE,
  WEB_SITE_VIEW_URL_TYPE,
} from './home-page.const';

export class HomePageService {
  constructor(
    @service(ActionWebSiteService)
    protected actionWebSiteService: ActionWebSiteService,
    @service(ObjectTreeService) protected objectTreeService: ObjectTreeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(NodeInterceptService)
    private nodeInterceptService: NodeInterceptService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
  ) {
    this.nodeInterceptService.registerEntityInterceptorService(
      HOME_PAGE_PROVIDER,
      HomePageService.name,
      'Calculate name from host and path',
      WEB_SITE_VIEW_URL_TYPE.name,
      EntityActionType.create,
      this.interceptWebSiteViewUrlCreate.bind(this),
    );
    this.nodeInterceptService.registerEntityInterceptorService(
      HOME_PAGE_PROVIDER,
      HomePageService.name,
      'Calculate name from host and path',
      WEB_SITE_VIEW_URL_TYPE.name,
      EntityActionType.update,
      this.interceptWebSiteViewUrlUpdate.bind(this),
    );
  }

  public async interceptWebSiteViewUrlCreate(
    entityId: string | undefined,
    entity: ObjectNode,
    requestEntity: Partial<ObjectNode>,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity> {
    if (requestEntity.name) {
      delete requestEntity.name;
    }
    const host =
      !!requestEntity.host && '' !== requestEntity.host
        ? requestEntity.host
        : false;
    if (!host) {
      return false;
    }
    requestEntity.path = requestEntity.path ? requestEntity.path : '';

    requestEntity.name = host + '$' + requestEntity.path;

    return true;
  }

  public async interceptWebSiteViewUrlUpdate(
    entityId: string | undefined,
    entity: ObjectNode,
    requestEntity: Partial<ObjectNode>,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity> {
    if (requestEntity.name) {
      delete requestEntity.name;
    }
    requestEntity.host =
      !!requestEntity.host && '' !== requestEntity.host
        ? requestEntity.host
        : entity.host;
    if (!requestEntity.host) {
      return false;
    }
    requestEntity.path = requestEntity.path
      ? requestEntity.path
      : entity.path
      ? entity.path
      : '';
    requestEntity.name = requestEntity.host + '$' + requestEntity.path;
    return true;
  }

  public async getWebSiteEntity(
    lang: string,
    subPath: string | undefined,
    pageName: string,
    ctx: CurrentContext,
    getCacheName: (name: string) => string = this.getCachePageName.bind(this),
  ): Promise<ObjectTree> {
    ctx.uriContext.uri.value.acceptLanguage = lang;

    const webSiteTree = await ctx.webSiteContext.webSiteTree.getOrSetValue(
      async () => {
        const host = ctx.uriContext.uri.value.host;
        const path = subPath ? subPath : '';
        let langTree: ObjectTree;

        const uri: ObjectNode = await this.objectNodeService.searchOwner(
          WEB_SITE_VIEW_URL_TYPE.name,
          host + '$' + path,
        );
        if (!uri) {
          throw ApplicationError.notFound({host, path});
        }
        try {
          langTree = await this.objectTreeService.getNamespaceTree(
            WEB_SITE_VIEW_URL_TYPE.name,
            host + '$' + path,
            WEB_SITE_CACHE_LANG_TYPE.name,
            lang,
            CurrentContext.get({}),
          );
        } catch (error) {
          await this.objectNodeService.add(
            {
              parentNodeId: uri.id,
              name: lang,
              objectTypeId: WEB_SITE_CACHE_LANG_TYPE.name,
            },
            CurrentContext.get({nodeContext: {parent: new ExpectedValue(uri)}}),
          );
          langTree = await this.objectTreeService.getNamespaceTree(
            WEB_SITE_VIEW_URL_TYPE.name,
            host + '$' + path,
            WEB_SITE_CACHE_LANG_TYPE.name,
            lang,
            CurrentContext.get({}),
          );
        }

        ctx.webSiteContext.pageBaseUri.value =
          path === '' ? '/' + lang + '/' : '/site/' + path + '/' + lang + '/';
        ctx.webSiteContext.siteBaseUriTree.value = langTree;
        for (const cache of ctx.webSiteContext.siteBaseUriTree.value.children) {
          if (getCacheName(pageName) === cache.treeNode.name) {
            await this.contentEntityService.addTransientContent(
              EntityName.objectNode,
              PAGE_CACHE_TYPE.contentType,
              cache.treeNode,
            );
            ctx.webSiteContext.cachedContent.value =
              cache.treeNode.contentPageCache;
            return (undefined as unknown) as ObjectTree;
          }
        }

        let entity = await this.objectTreeService.loadTree(
          uri.parentNodeId,
          ctx,
        );
        if (!entity) {
          // TODO: look for entity web site
          entity = await this.objectTreeService.getNamespaceTree(
            TENANT_TYPE.name,
            'Demonstration',
            TRAVEL_STORY_TYPE.name,
            'WelcomeSite',
            ctx,
          );
        }
        return entity;
      },
    );
    return webSiteTree;
  }

  public async getWebSitePageNode(
    entity: ObjectTree,
    pageName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    const webSitePageNode: ObjectNode = await ctx.webSiteContext.webSitePageNode.getOrSetValue(
      async () => {
        let result: ObjectNode = (undefined as unknown) as ObjectNode;
        const treeNodes = await this.objectNodeService.searchByTreeId(
          entity.id,
          {
            name: pageName,
            objectTypeIds: await this.objectTypeService.getImplementingTypes(
              PAGE_TYPE.name,
            ),
          },
        );

        if (treeNodes && 1 === treeNodes.length) {
          result = treeNodes[0];
        }
        return result;
      },
    );
    return webSitePageNode;
  }

  public getPageHref(
    page: IObjectTree,
    site: ObjectTree,
    ctx: CurrentContext,
  ): string {
    return ctx.webSiteContext.pageBaseUri.value + page.treeNode?.name;
  }

  public getPopupHref(
    page: IObjectTree,
    site: ObjectTree,
    ctx: CurrentContext,
  ): string {
    return (
      ctx.webSiteContext.pageBaseUri.value + page.treeNode?.name + '/popup'
    );
  }

  public getAdminHref(
    page: IObjectTree,
    site: ObjectTree,
    ctx: CurrentContext,
  ): string {
    return (
      '/admin/#/admin/owner/' +
      page.ownerType +
      '/' +
      page.ownerName +
      '/namespace/' +
      page.namespaceType +
      '/' +
      page.namespaceName
    );
  }

  public getCachePageName(pageName = '') {
    return 'cache$' + pageName;
  }

  public getCachePopupName(pageName = '') {
    return 'cache$' + pageName + '$popup';
  }

  public async getLoadingPageResponse(
    ctx: CurrentContext,
    lang?: string,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    if (!lang) {
      return new RedirectGeneratedResponse(
        ctx.uriContext.uri.value.baseUri +
          ctx.uriContext.uri.value.objectUri +
          ctx.uriContext.uri.value.acceptLanguage,
      );
    }
    const entity = await this.getWebSiteEntity(lang, siteName, '', ctx);
    if (ctx.webSiteContext.cachedContent.value) {
      return new HtmlGeneratedResponse(
        ctx.webSiteContext.cachedContent.value.body,
      );
    }

    const result: JsonGeneratedResponse<AjaxResult> = await this.actionWebSiteService.getWebSiteAjaxResponse(
      entity,
      this.getPageHref.bind(this),
      this.getAdminHref.bind(this),
      this.getPopupHref.bind(this),
      ctx,
    );
    result.json.headerScripts.pageScript = `
function getPageHref(page) {
  return '${ctx.webSiteContext.pageBaseUri.value}' +
    (page ? '/' + page.treeNode.name : '');
}
`;

    ctx.webSiteContext.cachedContent.value = {
      body: this.actionWebSiteService.getHtmlDocFromAjaxResult(result),
    };
    await this.storeCachePage('', ctx);
    return new HtmlGeneratedResponse(
      ctx.webSiteContext.cachedContent.value.body,
    );
  }

  protected async storeCachePage(
    pageName: string,
    ctx: CurrentContext,
    getCacheName: (name: string) => string = this.getCachePageName.bind(this),
  ) {
    await this.objectNodeService.add(
      {
        parentNodeId: ctx.webSiteContext.siteBaseUriTree.value.id,
        name: getCacheName(pageName),
        objectTypeId: PAGE_CACHE_TYPE.name,
        pageUrl: ctx.uriContext.uri.value.url,
        contentPageCache: ctx.webSiteContext.cachedContent.value,
      },
      CurrentContext.get({
        nodeContext: {
          parent: new ExpectedValue(
            ctx.webSiteContext.siteBaseUriTree.value.treeNode,
          ),
        },
      }),
    );
  }

  public async getWebSitePageResponse(
    lang: string,
    pageName: string,
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    const webSiteTree = await this.getWebSiteEntity(
      lang,
      siteName,
      pageName,
      ctx,
    );
    if (ctx.webSiteContext.cachedContent.value) {
      return new HtmlGeneratedResponse(
        ctx.webSiteContext.cachedContent.value.body,
      );
    }
    const pageNode = await this.getWebSitePageNode(webSiteTree, pageName, ctx);
    if (pageNode) {
      const result: JsonGeneratedResponse<AjaxResult> = await this.actionWebSiteService.getWebSitePageAjaxResponse(
        webSiteTree,
        pageNode.id as string,
        this.getPageHref.bind(this),
        this.getAdminHref.bind(this),
        this.getPopupHref.bind(this),
        ctx,
      );
      result.json.headerScripts.pageScript = `
    function getPageHref(page) {
      return '${ctx.webSiteContext.pageBaseUri.value}' +
        (page ? '/' + page.treeNode.name : '');
    }
    `;

      ctx.webSiteContext.cachedContent.value = {
        body: this.actionWebSiteService.getHtmlDocFromAjaxResult(result),
      };
      await this.storeCachePage(pageName, ctx);
      return new HtmlGeneratedResponse(
        ctx.webSiteContext.cachedContent.value.body,
      );
    } else {
      return this.getLoadingPageResponse(ctx);
    }
  }

  public async getWebSitePopupResponse(
    lang: string,
    pageName: string,
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    const webSiteTree = await this.getWebSiteEntity(
      lang,
      siteName,
      pageName,
      ctx,
      this.getCachePopupName.bind(this),
    );
    if (ctx.webSiteContext.cachedContent.value) {
      return new JsonGeneratedResponse(
        JSON.parse(ctx.webSiteContext.cachedContent.value.body),
      );
    }
    const pageNode = await this.getWebSitePageNode(webSiteTree, pageName, ctx);
    if (pageNode) {
      const popup: Popup = (
        await this.actionWebSiteService.popupWebSiteViewTree(
          webSiteTree,
          [pageNode.id as string],
          ctx,
        )
      ).json;
      ctx.webSiteContext.cachedContent.value = {
        body: JSON.stringify(popup),
      };
      await this.storeCachePage(
        pageName,
        ctx,
        this.getCachePopupName.bind(this),
      );
      return new JsonGeneratedResponse(popup);
    } else {
      throw ApplicationError.notFound({popupName: pageName});
    }
  }
}
