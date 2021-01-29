import {
  parse as cssParse,
  Rule,
  stringify as cssStringify,
  Stylesheet,
} from 'css';
import {ApplicationError} from './../../../helper/application-error';
import {EntityName} from './../../../models/entity-name';
import {ObjectNode} from './../../../models/object-node.model';
import {ObjectTree} from './../../../models/object-tree.model';
import {CurrentContext} from './../../../services/application.service';
import {MustacheService} from './../../../services/entity-definition/mustache.service';
import {InsideRestService} from './../../../services/inside-rest/inside-rest.service';
import {UriCompleteService} from './../../../services/uri-complete/uri-complete.service';
import {AjaxResult} from './ajax-result';
import {GenericObjectComponent} from './generated-object.component';
export class AjaxGeneratedResult extends GenericObjectComponent {
  constructor(
    protected mustacheService: MustacheService,
    protected insideRestService: InsideRestService,
    protected uriCompleteService: UriCompleteService,
    protected ctx: CurrentContext,
  ) {
    super(insideRestService, uriCompleteService, ctx);
  }
  async init(
    siteTreeId: string,
    pageTreeId?: string,
    dataTreeId?: string,
    templateTreeId?: string,
  ) {
    this.siteTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        siteTreeId,
        this.ctx,
      ),
      this.ctx,
    )) as ObjectTree;

    this.siteNode = (await this.insideRestService.read(
      this.siteTree.treeNode.uri as string,
      this.ctx,
    )) as ObjectNode;

    if (!this.siteNode.webSiteObjectTreeId) {
      throw ApplicationError.notFound({});
    }
    this.siteTemplateTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        this.siteNode.webSiteObjectTreeId,
        this.ctx,
      ),
      this.ctx,
    )) as ObjectTree;
    if (!this.siteTemplateTree?.treeNode?.uri) {
      throw ApplicationError.notFound({});
    }
    this.siteTemplateNode = (await this.insideRestService.read(
      this.siteTemplateTree.treeNode.uri,
      this.ctx,
    )) as ObjectNode;

    pageTreeId = pageTreeId
      ? pageTreeId
      : (this.siteTree.welcomePageId as string);
    this.pageTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        pageTreeId,
        this.ctx,
      ),
      this.ctx,
    )) as ObjectTree;

    this.pageNode = (await this.insideRestService.read(
      this.pageTree.treeNode.uri as string,
      this.ctx,
    )) as ObjectNode;

    dataTreeId = dataTreeId ? dataTreeId : this.siteTree.id;
    this.dataTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        dataTreeId,
        this.ctx,
      ),
      this.ctx,
    )) as ObjectTree;

    this.dataNode = (await this.insideRestService.read(
      this.dataTree.treeNode.uri as string,
      this.ctx,
    )) as ObjectNode;

    templateTreeId = templateTreeId
      ? templateTreeId
      : (this.siteTemplateTree.id as string);
    this.templateTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        templateTreeId,
        this.ctx,
      ),
      this.ctx,
    )) as ObjectTree;

    this.templateNode = (await this.insideRestService.read(
      this.templateTree.treeNode.uri as string,
      this.ctx,
    )) as ObjectNode;
  }

  public async generate(): Promise<AjaxResult> {
    const controller =
      this.templateNode.contentGenericTemplate?.controller ||
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
      ctrl.ctrl = this;
      this.ctrl = ctrl;

      // eslint-disable-next-line no-empty
    } catch (error) {}

    if (this.ctrl.initMustache) {
      await this.ctrl.initMustache();
    }

    const mustache = this.templateNode.contentGenericTemplate.templateMustache
      ? this.templateNode.contentGenericTemplate.templateMustache
      : 'missing mustache for ' + this.templateNode.name;

    this.ajaxResult.body =
      '<div class="template_' +
      this.templateNode.name +
      '">' +
      this.mustacheService.parse(
        mustache,
        this,
        this.templateNode.contentGenericTemplate.templatesMustache
          ? this.templateNode.contentGenericTemplate.templatesMustache
          : {},
      ) +
      '</div>';

    if (
      this.templateNode.contentGenericTemplate.css &&
      '' !== this.templateNode.contentGenericTemplate.css
    ) {
      const cssObject: Stylesheet = cssParse(
        this.templateNode.contentGenericTemplate.css,
      );
      if (cssObject.stylesheet) {
        for (const oneRule of cssObject.stylesheet.rules) {
          const rule = oneRule as Rule;
          if (rule.selectors) {
            for (const index in rule.selectors) {
              rule.selectors[index] =
                '.template_' +
                this.templateNode.name +
                ' ' +
                rule.selectors[index];
            }
          }
        }
      }
      this.ajaxResult.css['template_' + this.templateNode.name] = cssStringify(
        cssObject,
      );
    }

    if (
      this.templateNode.contentGenericTemplate.headerScript &&
      '' !== this.templateNode.contentGenericTemplate.headerScript
    ) {
      this.ajaxResult.headerScripts[
        'template_' + this.templateNode.name
      ] = this.templateNode.contentGenericTemplate.headerScript;
    }

    if (
      this.templateNode.contentGenericTemplate.footerScript &&
      '' !== this.templateNode.contentGenericTemplate.footerScript
    ) {
      this.ajaxResult.footerScripts[
        'template_' + this.templateNode.name
      ] = this.templateNode.contentGenericTemplate.footerScript;
    }

    return this.ajaxResult;
  }
}
