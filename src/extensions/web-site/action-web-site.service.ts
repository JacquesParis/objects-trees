import {service} from '@loopback/core';
import {ObjectNode} from '../../models';
import {
  ActionEntityService,
  GeneratedViewInterface,
} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {ObjectTypeService} from '../../services/object-type.service';
import {ApplicationError} from './../../helper/application-error';
import {EntityName} from './../../models/entity-name';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {MustacheService} from './../../services/entity-definition/mustache.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {TransientUriReferenceService} from './../../services/inside-rest/transient-uri-reference.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {WEB_SITE_PROVIDER, WEB_SITE_VIEW_TYPE} from './web-site.const';

export class GenericObjectComponent {
  siteTree: ObjectTree;
  siteNode: ObjectNode;
  templateTree: ObjectTree;
  templateNode: ObjectNode;
  dataTree: ObjectTree;
  dataNode: ObjectNode;
  pageTree: ObjectTree;
  pageNode: ObjectNode;
  siteTemplateTree: ObjectTree;
  siteTemplateNode: ObjectNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctrl: any;
  constructor(
    private insideRestService: InsideRestService,
    private uriCompleteService: UriCompleteService,
    private ctx: CurrentContext,
  ) {}

  async loadHtml(
    dataTree: ObjectTree,
    templateTree: ObjectTree,
  ): Promise<string> {
    const viewId =
      this.siteTree.id +
      '/view/html/' +
      this.pageNode.id +
      '/' +
      dataTree.id +
      '/' +
      templateTree.id;
    return ((await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, viewId, this.ctx),
      this.ctx,
    )) as unknown) as string;
  }
}

export class ActionWebSiteService {
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
  }

  public async htmlWebSiteViewTree(
    entity: ObjectTree,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedViewInterface> {
    const genericObject: GenericObjectComponent = new GenericObjectComponent(
      this.insideRestService,
      this.uriCompleteService,
      ctx,
    );
    genericObject.siteTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        entity.id as string,
        ctx,
      ),
      ctx,
    )) as ObjectTree;

    genericObject.siteNode = (await this.insideRestService.read(
      genericObject.siteTree.treeNode.uri as string,
      ctx,
    )) as ObjectNode;

    if (!genericObject.siteNode.webSiteObjectTreeId) {
      throw ApplicationError.notFound({html: entity.uri});
    }
    genericObject.siteTemplateTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        genericObject.siteNode.webSiteObjectTreeId,
        ctx,
      ),
      ctx,
    )) as ObjectTree;
    if (!genericObject.siteTemplateTree?.treeNode?.uri) {
      throw ApplicationError.notFound({html: entity.uri});
    }
    genericObject.siteTemplateNode = (await this.insideRestService.read(
      genericObject.siteTemplateTree.treeNode.uri,
      ctx,
    )) as ObjectNode;

    const pageTreeId = args[0] ? args[0] : genericObject.siteTree.welcomePageId;
    genericObject.pageTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, pageTreeId, ctx),
      ctx,
    )) as ObjectTree;

    genericObject.pageNode = (await this.insideRestService.read(
      genericObject.pageTree.treeNode.uri as string,
      ctx,
    )) as ObjectNode;

    const dataTreeId = args[1] ? args[1] : genericObject.siteTree.id;
    genericObject.dataTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, dataTreeId, ctx),
      ctx,
    )) as ObjectTree;

    genericObject.dataNode = (await this.insideRestService.read(
      genericObject.dataTree.treeNode.uri as string,
      ctx,
    )) as ObjectNode;

    const templateTreeId = args[2]
      ? args[2]
      : genericObject.siteTemplateTree.id;
    genericObject.templateTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        templateTreeId as string,
        ctx,
      ),
      ctx,
    )) as ObjectTree;

    genericObject.templateNode = (await this.insideRestService.read(
      genericObject.templateTree.treeNode.uri as string,
      ctx,
    )) as ObjectNode;

    const controller =
      genericObject.templateNode.contentGenericTemplate?.controller ||
      `function newFunction() {
        return {
          ctrl: undefined,
          async init(ctrl) {
            this.ctrl = ctrl;
            void this.backGroundInit();
          },
          async backGroundInit() {},
        };
      }
      newFunction();
      `;
    try {
      const ctrl = eval(controller);
      if (!ctrl.init) {
        ctrl.init = async (
          component: GenericObjectComponent,
        ): Promise<void> => {};
      }
      ctrl.ctrl = genericObject;
      genericObject.ctrl = ctrl;

      // eslint-disable-next-line no-empty
    } catch (error) {}

    if (genericObject.ctrl.initMustache) {
      await genericObject.ctrl.initMustache();
    }

    const mustache = genericObject.templateNode.contentGenericTemplate
      .templateMustache
      ? genericObject.templateNode.contentGenericTemplate.templateMustache
      : 'missing mustache for ' + genericObject.templateNode.name;

    return {
      type: 'text',
      text: {
        contentType: 'text/html',
        response: this.mustacheService.parse(mustache, genericObject),
      },
    };
  }
}
