import {IObjectTree, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {GeneratedResponse} from '../../helper/generated-response';
import {CurrentContext} from '../../services';
import {ApplicationError} from './../../helper/application-error';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {EntityActionType} from './../../services/application.service';
import {NodeInterceptService} from './../../services/entity-intercept/node-intercept.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TENANT_TYPE} from './../../services/object-tree/object-tree.const';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {TRAVEL_STORY_TYPE} from './../travel-story/travel-story-type.const';
import {ActionWebSiteService} from './../web-site/action-web-site.service';
import {PAGE_TYPE} from './../web-site/web-site.const';
import {HOME_PAGE_PROVIDER, WEB_SITE_VIEW_URL_TYPE} from './home-page.const';

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

  public async getWebSiteEntity(ctx: CurrentContext): Promise<ObjectTree> {
    const host = ctx.uriContext.uri.value.host;
    const path = ctx.uriContext.uri.value.objectUri.startsWith('site/')
      ? ctx.uriContext.uri.value.objectUri.substr(5)
      : '';
    const uri = await this.objectNodeService.searchOwner(
      WEB_SITE_VIEW_URL_TYPE.name,
      host + '$' + path,
    );

    if (!uri) {
      throw ApplicationError.notFound({host, path});
    }
    // TODO: look for entity web site
    let entity = await this.objectTreeService.loadTree(uri.parentNodeId, ctx);
    if (!entity) {
      // TODO: look for entity web site
      entity = await this.objectTreeService.getNamespaceTree(
        TENANT_TYPE.name,
        'Demonstration',
        TRAVEL_STORY_TYPE.name,
        'WelomeSite',
        ctx,
      );
    }
    return entity;
  }

  public async getWebSitePageNode(
    entity: ObjectTree,
    pageName: string,
    ctx: CurrentContext,
  ): Promise<ObjectNode> {
    let result: ObjectNode = (undefined as unknown) as ObjectNode;
    const treeNodes = await this.objectNodeService.searchByTreeId(entity.id, {
      name: pageName,
      objectTypeIds: await this.objectTypeService.getImplementingTypes(
        PAGE_TYPE.name,
      ),
    });

    if (treeNodes && 1 === treeNodes.length) {
      result = treeNodes[0];
    }
    return result;
  }

  public getPageHref(
    page: IObjectTree,
    site: ObjectTree,
    ctx: CurrentContext,
  ): string {
    return '/page/' + page.treeNode?.name;
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
  public async getLoadingPageResponse(
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
    const entity = await this.getWebSiteEntity(ctx);
    return this.actionWebSiteService.getHtmlDocFromAjaxResult(
      await this.actionWebSiteService.getWebSiteAjaxResponse(
        entity,
        this.getPageHref.bind(this),
        this.getAdminHref.bind(this),
        ctx,
      ),
    );
  }

  public async getWebSitePageResponse(
    pageName: string,
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
    const webSiteTree = await this.getWebSiteEntity(ctx);
    const pageNode = await this.getWebSitePageNode(webSiteTree, pageName, ctx);
    if (pageNode) {
      return this.actionWebSiteService.getHtmlDocFromAjaxResult(
        await this.actionWebSiteService.getWebSitePageAjaxResponse(
          webSiteTree,
          pageNode.id as string,
          this.getPageHref.bind(this),
          this.getAdminHref.bind(this),
          ctx,
        ),
      );
    } else {
      return this.getLoadingPageResponse(ctx);
    }
  }
}
