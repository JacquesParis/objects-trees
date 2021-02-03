import {IObjectTree, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {GeneratedResponse} from '../../helper/generated-response';
import {EntityName} from '../../models';
import {CurrentContext} from '../../services';
import {ApplicationError} from './../../helper/application-error';
import {HtmlGeneratedResponse} from './../../helper/generated-response';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {EntityActionType} from './../../services/application.service';
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
import {
  HOME_PAGE_PROVIDER,
  PAGE_CACHE_TYPE,
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
    subPath: string | undefined,
    pageName: string,
    ctx: CurrentContext,
  ): Promise<ObjectTree> {
    const webSiteTree = await ctx.webSiteContext.webSiteTree.getOrSetValue(
      async () => {
        const host = ctx.uriContext.uri.value.host;
        const path = subPath ? subPath : '';
        const uri: ObjectTree = await this.objectTreeService.getOwnerTree(
          WEB_SITE_VIEW_URL_TYPE.name,
          host + '$' + path,
          CurrentContext.get({}),
        );

        if (!uri) {
          throw ApplicationError.notFound({host, path});
        }

        ctx.webSiteContext.pageBaseUri.value =
          path === '' ? '/page/' : '/site/' + path + '/';
        ctx.webSiteContext.siteBaseUriTree.value = uri;
        for (const cache of ctx.webSiteContext.siteBaseUriTree.value.children) {
          if (this.getCachePageName(pageName) === cache.treeNode.name) {
            await this.contentEntityService.addTransientContent(
              EntityName.objectNode,
              PAGE_CACHE_TYPE.contentType,
              cache.treeNode,
            );
            ctx.webSiteContext.cachedPage.value = new HtmlGeneratedResponse(
              cache.treeNode.contentPageCache.body,
            );
            return (undefined as unknown) as ObjectTree;
          }
        }

        let entity = await this.objectTreeService.loadTree(
          uri.treeNode.parentNodeId,
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

  public async getLoadingPageResponse(
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    const entity = await this.getWebSiteEntity(siteName, '', ctx);
    if (ctx.webSiteContext.cachedPage.value) {
      return ctx.webSiteContext.cachedPage.value;
    }
    ctx.webSiteContext.cachedPage.value = this.actionWebSiteService.getHtmlDocFromAjaxResult(
      await this.actionWebSiteService.getWebSiteAjaxResponse(
        entity,
        this.getPageHref.bind(this),
        this.getAdminHref.bind(this),
        ctx,
      ),
    );
    await this.storeCachePage('', ctx);
    return ctx.webSiteContext.cachedPage.value;
  }

  protected async storeCachePage(pageName: string, ctx: CurrentContext) {
    await this.objectNodeService.add(
      {
        parentNodeId: ctx.webSiteContext.siteBaseUriTree.value.id,
        name: this.getCachePageName(pageName),
        objectTypeId: PAGE_CACHE_TYPE.name,
        contentPageCache: {
          body: ctx.webSiteContext.cachedPage.value.response,
        },
      },
      ctx,
    );
  }

  public async getWebSitePageResponse(
    pageName: string,
    ctx: CurrentContext,
    siteName?: string,
  ): Promise<GeneratedResponse> {
    const webSiteTree = await this.getWebSiteEntity(siteName, pageName, ctx);
    if (ctx.webSiteContext.cachedPage.value) {
      return ctx.webSiteContext.cachedPage.value;
    }
    const pageNode = await this.getWebSitePageNode(webSiteTree, pageName, ctx);
    if (pageNode) {
      ctx.webSiteContext.cachedPage.value = this.actionWebSiteService.getHtmlDocFromAjaxResult(
        await this.actionWebSiteService.getWebSitePageAjaxResponse(
          webSiteTree,
          pageNode.id as string,
          this.getPageHref.bind(this),
          this.getAdminHref.bind(this),
          ctx,
        ),
      );
      await this.storeCachePage(pageName, ctx);
      return ctx.webSiteContext.cachedPage.value;
    } else {
      return this.getLoadingPageResponse(ctx);
    }
  }
}
