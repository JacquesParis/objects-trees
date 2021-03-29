import {IObjectTree, IRestEntity} from '@jacquesparis/objects-model';
import {AjaxResult} from '@jacquesparis/objects-website';
import {service} from '@loopback/core';
import {Principal} from '@loopback/security';
import {countries, Country, Language, languagesAll} from 'countries-list';
import {JSDOM} from 'jsdom';
import path from 'path';
import {
  FileGeneratedResponse,
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
import {LocalesHelper} from './../../helper/locales-helper';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {ActionEntityService} from './../../services/action-entity/action-entity.service';
import {
  ApplicationService,
  EntityActionType,
  ExpectedValue,
} from './../../services/application.service';
import {ContentEntityService} from './../../services/content-entity/content-entity.service';
import {NodeInterceptService} from './../../services/entity-intercept/node-intercept.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TENANT_TYPE} from './../../services/object-tree/object-tree.const';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
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
    private actionWebSiteService: ActionWebSiteService,
    @service(ObjectTreeService) private objectTreeService: ObjectTreeService,
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService) private objectTypeService: ObjectTypeService,
    @service(NodeInterceptService)
    private nodeInterceptService: NodeInterceptService,
    @service(ContentEntityService)
    private contentEntityService: ContentEntityService,
    @service(ApplicationService)
    private applicationService: ApplicationService,
    @service(ActionEntityService)
    private actionEntityService: ActionEntityService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService) private insideRestService: InsideRestService,
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
    this.actionEntityService.registerNewMethodFunction(
      HOME_PAGE_PROVIDER,
      HomePageService.name,
      'Publish web site',
      EntityName.objectNode,
      'publish',
      WEB_SITE_VIEW_URL_TYPE.name,
      this.publishSite.bind(this),
      'delete',
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      HOME_PAGE_PROVIDER,
      HomePageService.name,
      'Add publish method definition to publish site for a locale',
      EntityName.objectNode,
      WEB_SITE_VIEW_URL_TYPE.name,
      this.completeWebSiteCacheLangTypeNode.bind(this),
    );
  }

  public async completeWebSiteCacheLangTypeNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    const urls: string[] = [];
    const pageTypeIds = await this.objectTypeService.getImplementingTypes(
      PAGE_TYPE.name,
    );
    // TO DO : list PAGE_TYPE.name
    const pages: ObjectNode[] = await this.objectNodeService.searchByTreeId(
      objectNode.parentTreeId,
      {objectTypeIds: pageTypeIds},
    );
    for (const page of pages) {
      urls.push('/' + page.name);
    }
    for (const page of pages) {
      urls.push('/' + page.name + '/popup');
    }

    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    if (!objectNode.entityCtx?.actions) {
      objectNode.entityCtx.actions = {};
    }
    if (!objectNode.entityCtx.actions.methods) {
      objectNode.entityCtx.actions.methods = [];
    }
    objectNode.entityCtx.actions.methods.push({
      methodId: 'publish',
      methodName: 'Publish site',
      actionName: 'Publish site',
      parameters: {
        type: 'object',
        properties: {
          locale: {
            type: 'string',
            title: 'Language',
            required: true,
            oneOf: [
              /*
            {"enum": ["none"], "title": "never"},
            */
            ],
          },
        },
      },
      handlebarsMethodSampling: `[
          {
            "methodId": "publish",
            "parameters":{
              "init":"true",
              "url":"",
              "locale":"{{locale}}"
            }
          }`,
    });
    for (const url of urls) {
      objectNode.entityCtx.actions.methods[
        objectNode.entityCtx.actions.methods.length - 1
      ].handlebarsMethodSampling += `,
        {
          "methodId": "publish",
          "parameters":{
            "url":"${url}",
            "locale":"{{locale}}"
          }
        }`;
    }
    objectNode.entityCtx.actions.methods[
      objectNode.entityCtx.actions.methods.length - 1
    ].handlebarsMethodSampling += ']';

    const localesChildren = await this.objectNodeService.getOrCreateChildren(
      objectNode.id as string,
      WEB_SITE_CACHE_LANG_TYPE.name,
    );
    if (localesChildren?.length > 0) {
      objectNode.entityCtx.actions.methods[
        objectNode.entityCtx.actions.methods.length - 1
      ].parameters.properties.locale.oneOf.push({
        enum: [localesChildren.map((child) => child.name).join(',')],
        title: 'Already published countries',
      });
    }

    for (const country in countries) {
      for (const lang of (countries as {[country: string]: Country})[country]
        .languages) {
        objectNode.entityCtx.actions.methods[
          objectNode.entityCtx.actions.methods.length - 1
        ].parameters.properties.locale.oneOf.push({
          enum: [lang + '-' + country],
          title:
            (countries as {[country: string]: Country})[country].name +
            ', ' +
            (languagesAll as {[lang: string]: Language})[lang].name,
        });
      }
    }
  }

  public async publishSite(
    objectNode: ObjectNode,
    _args: Object,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const args: {url: string; locale: string; init?: boolean} = _args as {
      url: string;
      locale: string;
      init?: boolean;
    };

    const locales = args.locale.split(',');

    if (args.init) {
      const localesChildren = await this.objectNodeService.getOrCreateChildren(
        objectNode.id as string,
        WEB_SITE_CACHE_LANG_TYPE.name,
      );
      for (const child of localesChildren) {
        if (-1 < locales.indexOf(child.name)) {
          await this.objectNodeService.removeById(
            child.id as string,
            CurrentContext.get(ctx),
          );
        }
      }
    }

    for (const locale of locales) {
      await this.publishSiteLang(objectNode, locale, args.url, ctx);
    }
    return this.actionEntityService.getEntity<ObjectTree>(
      EntityName.objectTree,
      objectNode.id as string,
      CurrentContext.get(ctx, {}),
    );
  }

  public async publishSiteLang(
    objectNode: ObjectNode,
    lang: Object,
    url: string,
    ctx: CurrentContext,
  ): Promise<void> {
    // TO DO : get WebSite or build the URL ?
    let webSiteUrl = `http://${objectNode.host}`;
    if (objectNode.path) {
      webSiteUrl += `/site/${objectNode.path}`;
    }
    webSiteUrl += '/' + lang;
    await this.insideRestService.read(webSiteUrl + url, ctx);
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

  public async lookWebSiteEntry(
    subPath: string | undefined,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    return ctx.webSiteContext.urlNode.getOrSetValue(async () => {
      const host = ctx.uriContext.uri.value.host;
      subPath = subPath ? subPath : '';
      const uri: ObjectNode = await this.objectNodeService.searchOwner(
        WEB_SITE_VIEW_URL_TYPE.name,
        host + '$' + subPath,
      );
      if (!uri) {
        throw ApplicationError.notFound({host, subPath});
      }
      return uri;
    });
  }

  private initLangAndUser(
    lang: string,
    ctx: CurrentContext,
  ): GeneratedResponse | undefined {
    const newLang = LocalesHelper.getValidLocales(lang);
    if (newLang !== lang) {
      return new RedirectGeneratedResponse(
        ctx.uriContext.uri.value.baseUri +
          ctx.uriContext.uri.value.objectUri.replace('/' + lang, '/' + newLang),
      );
    }
    ctx.accessRightsContext.user.value = (null as unknown) as Principal;
    ctx.accessRightsContext.authorization.value = (undefined as unknown) as string;
    return undefined;
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
        subPath = subPath ? subPath : '';
        let langTree: ObjectTree;

        const uri: ObjectNode = await this.lookWebSiteEntry(subPath, ctx);
        try {
          langTree = await this.objectTreeService.getNamespaceTree(
            WEB_SITE_VIEW_URL_TYPE.name,
            host + '$' + subPath,
            WEB_SITE_CACHE_LANG_TYPE.name,
            lang,
            CurrentContext.get(ctx, {}),
          );
        } catch (error) {
          await this.objectNodeService.add(
            {
              parentNodeId: uri.id,
              name: lang,
              objectTypeId: WEB_SITE_CACHE_LANG_TYPE.name,
            },
            CurrentContext.get(ctx, {
              nodeContext: {parent: new ExpectedValue(uri)},
            }),
          );
          langTree = await this.objectTreeService.getNamespaceTree(
            WEB_SITE_VIEW_URL_TYPE.name,
            host + '$' + subPath,
            WEB_SITE_CACHE_LANG_TYPE.name,
            lang,
            CurrentContext.get(ctx, {}),
          );
        }

        ctx.webSiteContext.pageBaseUri.value =
          subPath === ''
            ? '/' + lang + '/'
            : '/site/' + subPath + '/' + lang + '/';
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

  private setMeta(adminDOM: JSDOM, name: string, content: string) {
    if (
      adminDOM.window.document.head.querySelector(
        '[name~="' + name + '"][content]',
      )
    ) {
      const meta: HTMLMetaElement = adminDOM.window.document.head.querySelector(
        '[name~="' + name + '"][content]',
      ) as HTMLMetaElement;
      meta.name = name;
      meta.content = content;
    } else {
      const meta: HTMLMetaElement = adminDOM.window.document.createElement(
        'meta',
      );
      meta.name = name;
      meta.content = content;
      adminDOM.window.document.head.append(meta);
    }
  }

  private addLinkElement(
    adminDOM: JSDOM,
    rel: string,
    type: string,
    href: string,
  ) {
    const link: HTMLLinkElement = adminDOM.window.document.createElement(
      'link',
    );
    link.rel = rel;
    link.type = type;
    link.href = href;
    adminDOM.window.document.head.append(link);
  }

  public async renderAdminPage(
    subPath: string | undefined,
    ctx: CurrentContext,
  ): Promise<HtmlGeneratedResponse> {
    const adminDOM: JSDOM = await JSDOM.fromFile(
      path.join(
        this.applicationService.app.rootDirectory,
        'node_modules/@jacquesparis/objects-angular/index.html',
      ),
      {},
    );

    // <meta name="objectTrees:rootState_" content="app:view" />
    this.setMeta(adminDOM, 'objectTrees:rootState', 'app:admin');
    //     <meta name="objectTrees:api_" content="http://to.ochoeurdunet.org/api" />
    this.setMeta(
      adminDOM,
      'objectTrees:api',
      ctx.uriContext.uri.value.baseUri + '/api',
    );

    const siteEntry = await this.lookWebSiteEntry(subPath, ctx);
    const siteOwner: ObjectNode = await this.objectNodeService.searchById(
      siteEntry.parentOwnerId,
    );
    const siteNamespace: ObjectNode =
      siteEntry.parentNamespaceId === siteEntry.parentOwnerId
        ? siteOwner
        : await this.objectNodeService.searchById(siteEntry.parentNamespaceId);
    // <meta name="objectTrees:ownerName" content="Demonstration" />
    this.setMeta(adminDOM, 'objectTrees:ownerName', siteOwner.name);

    // <meta       name="objectTrees:siteId"       content="namespace/Tenant/Demonstration/TravelStory/TravelStoryExample"

    if (siteEntry.parentNamespaceId === siteEntry.parentOwnerId) {
      this.setMeta(
        adminDOM,
        'objectTrees:siteId',
        `owner/${siteOwner.objectTypeId}/${siteOwner.name}`,
      );
    } else {
      this.setMeta(
        adminDOM,
        'objectTrees:siteId',
        `namespace/${siteOwner.objectTypeId}/${siteOwner.name}/${siteNamespace.objectTypeId}/${siteNamespace.name}`,
      );
    }

    this.addLinkElement(
      adminDOM,
      'icon',
      'image/png',
      (subPath ? '/site/' + subPath : '') + '/favicon.png',
    );

    return new HtmlGeneratedResponse(adminDOM.serialize());
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

  public async getFavicon(
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    return new FileGeneratedResponse(
      path.join(__dirname, '/img/favicon.png'),
      'favicon.png',
    );
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

    const redirectResponse:
      | GeneratedResponse
      | undefined = this.initLangAndUser(lang, ctx);
    if (redirectResponse) {
      return redirectResponse;
    }

    const entity = await this.getWebSiteEntity(lang, siteName, '', ctx);
    if (ctx.webSiteContext.cachedContent.value) {
      return new HtmlGeneratedResponse(
        ctx.webSiteContext.cachedContent.value.body,
      );
    }

    const result: JsonGeneratedResponse<
      AjaxResult & {headerTags: string[]}
    > = (await this.actionWebSiteService.getWebSiteAjaxResponse(
      entity,
      this.getPageHref.bind(this),
      this.getAdminHref.bind(this),
      this.getPopupHref.bind(this),
      ctx,
    )) as JsonGeneratedResponse<AjaxResult & {headerTags: string[]}>;
    result.json.headerScripts.pageScript = `
function getPageHref(page) {
  return '${ctx.webSiteContext.pageBaseUri.value}' +
    (page ? '/' + page.treeNode.name : '');
}
`;
    result.json.headerTags = [
      `<link rel="icon" type="image/png" href="${ctx.webSiteContext.pageBaseUri.value.replace(
        '/' + lang + '/',
        '/favicon',
      )}.png">`,
    ];

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
    try {
      await this.objectNodeService.add(
        {
          parentNodeId: ctx.webSiteContext.siteBaseUriTree.value.id,
          name: getCacheName(pageName),
          objectTypeId: PAGE_CACHE_TYPE.name,
          pageUrl: ctx.uriContext.uri.value.url,
          contentPageCache: ctx.webSiteContext.cachedContent.value,
        },
        CurrentContext.get(ctx, {
          nodeContext: {
            parent: new ExpectedValue(
              ctx.webSiteContext.siteBaseUriTree.value.treeNode,
            ),
          },
        }),
      );
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  public async getWebSitePageResponse(
    lang: string,
    pageName: string,
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    const redirectResponse:
      | GeneratedResponse
      | undefined = this.initLangAndUser(lang, ctx);
    if (redirectResponse) {
      return redirectResponse;
    }

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
      const result: JsonGeneratedResponse<
        AjaxResult & {headerTags: string[]}
      > = (await this.actionWebSiteService.getWebSitePageAjaxResponse(
        webSiteTree,
        pageNode.id as string,
        this.getPageHref.bind(this),
        this.getAdminHref.bind(this),
        this.getPopupHref.bind(this),
        ctx,
      )) as JsonGeneratedResponse<AjaxResult & {headerTags: string[]}>;
      result.json.headerScripts.pageScript = `
    function getPageHref(page) {
      return '${ctx.webSiteContext.pageBaseUri.value}' +
        (page ? '/' + page.treeNode.name : '');
    }
    `;
      result.json.headerTags = [
        `<link rel="icon" type="image/png" href="${ctx.webSiteContext.pageBaseUri.value.replace(
          '/' + lang + '/',
          '/favicon',
        )}.png">`,
      ];

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
    const redirectResponse:
      | GeneratedResponse
      | undefined = this.initLangAndUser(lang, ctx);
    if (redirectResponse) {
      return redirectResponse;
    }

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
