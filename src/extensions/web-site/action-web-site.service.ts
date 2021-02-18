import {
  IJsonSchema,
  IObjectNode,
  IObjectTree,
} from '@jacquesparis/objects-model';
import {
  AjaxResult,
  WebsiteGenerationService,
} from '@jacquesparis/objects-website';
import {service} from '@loopback/core';
import {contentGenericTemplate} from '../../helper';
import {
  GeneratedResponse,
  TextGeneratedResponse,
} from '../../helper/generated-response';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {ObjectTypeService} from '../../services/object-type.service';
import {
  HtmlGeneratedResponse,
  JsonGeneratedResponse,
} from './../../helper/generated-response';
import {EntityName} from './../../models/entity-name';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {MustacheService} from './../../services/entity-definition/mustache.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {TransientUriReferenceService} from './../../services/inside-rest/transient-uri-reference.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {WEB_SITE_PROVIDER, WEB_SITE_VIEW_TYPE} from './web-site.const';

export class ActionWebSiteService {
  protected doc: {
    templatesMustache: {[templateId: string]: string};
    templateMustache: string;
    headerScript: string;
    footerScript: string;
    templateAngular: string;
    scss: string;
    css: string;
    controller: string;
    refererConfig: IJsonSchema;
  };
  protected websiteGenerationService: WebsiteGenerationService;
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(TransientUriReferenceService)
    private transientUriReferenceService: TransientUriReferenceService,
    @service(InsideRestService) private insideRestService: InsideRestService,
    @service(MustacheService) private mustacheService: MustacheService,
  ) {
    this.websiteGenerationService = WebsiteGenerationService.get();
    this.actionEntityService.registerNewViewFunction(
      WEB_SITE_PROVIDER,
      ActionWebSiteService.name,
      'Build ajax view',
      EntityName.objectTree,
      'ajax',
      WEB_SITE_VIEW_TYPE.name,
      this.ajaxWebSiteViewTree.bind(this),
      'read',
    );
    this.actionEntityService.registerNewViewFunction(
      WEB_SITE_PROVIDER,
      ActionWebSiteService.name,
      'Build html view',
      EntityName.objectTree,
      'html',
      WEB_SITE_VIEW_TYPE.name,
      this.htmlWebSiteViewTree.bind(this),
      'read',
    );
    this.doc = contentGenericTemplate(__dirname, 'doc');
  }

  public async htmlWebSiteViewTree(
    entity: ObjectTree,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
    const result: GeneratedResponse = await this.ajaxWebSiteViewTree(
      entity,
      args,
      ctx,
    );
    return this.getHtmlDocFromAjaxResult(result);
  }
  public getHtmlDocFromAjaxResult(
    response: GeneratedResponse,
  ): HtmlGeneratedResponse {
    let result: HtmlGeneratedResponse = (undefined as unknown) as HtmlGeneratedResponse;
    if (response instanceof TextGeneratedResponse) {
      result = new HtmlGeneratedResponse(
        this.mustacheService.parse(this.doc.templateMustache, {
          body: response.response,
          headerScript: this.doc.headerScript,
        }),
      );
    } else if (response instanceof JsonGeneratedResponse) {
      const docParts: AjaxResult & {headerScript: string} = response.json;
      docParts.headerScript = this.doc.headerScript;

      result = new HtmlGeneratedResponse(
        this.mustacheService.parse(this.doc.templateMustache, docParts),
      );
    }
    return result;
  }

  public getPageHref(
    page: IObjectTree,
    site: ObjectTree,
    ctx: CurrentContext,
  ): string {
    const viewId =
      site.id +
      '/view/html' +
      (page ? '/' + (page.treeNode as IObjectNode).id : '');
    return this.uriCompleteService.getUri(EntityName.objectTree, viewId, ctx);
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

  public async getWebSiteAjaxResponse(
    webSiteTree: ObjectTree,
    getPageHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string,
    getAdminHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string,
    ctx: CurrentContext,
  ) {
    return this.ajaxWebSiteViewTree(
      webSiteTree,
      {},
      ctx,
      getPageHref,
      getAdminHref,
    );
  }

  public async getWebSitePageAjaxResponse(
    webSiteTree: ObjectTree,
    pageNodeId: string,
    getPageHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string,
    getAdminHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string,
    ctx: CurrentContext,
  ) {
    return this.ajaxWebSiteViewTree(
      webSiteTree,
      {0: pageNodeId},
      ctx,
      getPageHref,
      getAdminHref,
    );
  }

  public async ajaxWebSiteViewTree(
    entity: ObjectTree,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
    getPageHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string = this.getPageHref.bind(this),
    getAdminHref: (
      page: IObjectTree,
      site: ObjectTree,
      ctx: CurrentContext,
    ) => string = this.getAdminHref.bind(this),
  ): Promise<GeneratedResponse> {
    const ajaxResult: AjaxResult = await this.websiteGenerationService.getAjaxContent(
      {
        getCachedOrRemoteObjectById: async (
          treeId: string,
        ): Promise<IObjectTree> => {
          return (await this.insideRestService.read(
            this.uriCompleteService.getUri(EntityName.objectTree, treeId, ctx),
            ctx,
          )) as IObjectTree;
        },
      },
      {
        getCachedOrRemoteObjectById: async (
          nodeId: string,
        ): Promise<IObjectNode> => {
          return (await this.insideRestService.read(
            this.uriCompleteService.getUri(EntityName.objectNode, nodeId, ctx),
            ctx,
          )) as IObjectNode;
        },
      },
      {
        getPageHref: (page: IObjectTree): string => {
          return getPageHref(page, entity, ctx);
        },
        getAdminHref: (page: IObjectTree): string => {
          return getAdminHref(page, entity, ctx);
        },
      },
      entity.id,
      args[0],
      args[1],
      args[2],
    );

    return new JsonGeneratedResponse<AjaxResult>(ajaxResult);
  }
}
