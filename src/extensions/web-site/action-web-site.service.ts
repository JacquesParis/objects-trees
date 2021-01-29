import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import * as css from 'css';
import {contentGenericTemplate} from '../../helper';
import {
  GeneratedResponse,
  TextGeneratedResponse,
} from '../../helper/generated-response';
import {ObjectNode} from '../../models';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
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

  async loadAjax(
    dataTree: ObjectTree,
    templateTree: ObjectTree,
  ): Promise<string> {
    const viewId =
      this.siteTree.id +
      '/view/ajax/' +
      this.pageNode.id +
      '/' +
      dataTree.id +
      '/' +
      templateTree.id;
    /*
    console.log(
      'from',
      this.dataNode.name,
      'template',
      this.templateNode.name,
      'include',
      dataTree.treeNode.name,
      'template',
      templateTree.treeNode.name,
      viewId,
    );
    */
    return ((await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, viewId, this.ctx),
      this.ctx,
    )) as unknown) as string;
  }

  public getPageHref(page: ObjectTree): string {
    const viewId =
      this.siteTree.id + '/view/html' + (page ? '/' + page.treeNode.id : '');
    return this.uriCompleteService.getUri(
      EntityName.objectTree,
      viewId,
      this.ctx,
    );
  }

  public getAdminHref(page: ObjectTree): string {
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

  public async getObjectNode(nodeId: string): Promise<ObjectNode> {
    return (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectNode, nodeId, this.ctx),
      this.ctx,
    )) as ObjectNode;
  }

  public async getObjectTree(treeId: string): Promise<ObjectTree> {
    return (await this.insideRestService.read(
      this.uriCompleteService.getUri(EntityName.objectTree, treeId, this.ctx),
      this.ctx,
    )) as ObjectTree;
  }

  public getImgSrc(controlValue: {
    base64?: string;
    type?: string;
    uri?: string;
  }): string {
    return controlValue?.base64 && controlValue.type
      ? 'data:' + controlValue.type + ';base64,' + controlValue.base64
      : (controlValue?.uri as string);
  }

  public getImgBackground(controlValue: {
    base64?: string;
    type?: string;
    uri?: string;
  }): string {
    return controlValue?.base64 && controlValue?.type
      ? "url('" +
          'data:' +
          controlValue.type +
          ';base64,' +
          controlValue.base64 +
          "')"
      : "url('" + controlValue?.uri + "')";
  }

  public getColSizes(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    keepProportion = false,
  ) {
    const sizes = {
      xs: 576,
      sm: 768,
      md: 992,
      lg: 1200,
      xl: 1400,
    };
    const breakingSize =
      'none' === breakSize
        ? sizes.xs
        : Math.min(
            ...Object.values(sizes).filter((size) => size > sizes[breakSize]),
          );
    const returnedSizes: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    } = {};
    for (const size in sizes) {
      if (sizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] < breakingSize) {
        returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] = 12;
      } else {
        returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] = Math.round(
          minWidth +
            ((maxWith - minWidth) *
              (sizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] -
                breakingSize)) /
              (sizes.xl - breakingSize),
        );
        if (keepProportion) {
          returnedSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] =
            Math.round(
              (returnedSizes[
                size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'
              ] as number) / maxWith,
            ) * maxWith;
        }
      }
    }
    return returnedSizes;
  }

  getColClass(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    keepProportion = false,
  ) {
    const colSizes = this.getColSizes(
      minWidth,
      maxWith,
      breakSize,
      keepProportion,
    );
    const returnedClasses = [];
    for (const size in colSizes) {
      returnedClasses.push(
        'col-' +
          size +
          '-' +
          colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'],
      );
    }
    return returnedClasses.join(' ').replace('col-xs', 'col');
  }

  public getColFloatClass(
    minWidth: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    maxWith: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12,
    breakSize: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    side = 'left',
    keepProportion = false,
  ) {
    const colSizes = this.getColSizes(
      minWidth,
      maxWith,
      breakSize,
      keepProportion,
    );
    const returnedClasses = [];
    for (const size in colSizes) {
      const sizeClass = 'xs' === size ? '' : '-' + size;
      returnedClasses.push(
        'col' +
          sizeClass +
          '-' +
          colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] +
          (colSizes[size as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] !== 12
            ? ' float' + sizeClass + '-' + side
            : ''),
      );
    }
    return returnedClasses.join(' ');
  }
}

export class ActionWebSiteService {
  doc: {
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
    if (result instanceof TextGeneratedResponse) {
      result.response = this.mustacheService.parse(
        this.doc.templateMustache,
        result.response,
      );
    }
    return result;
  }

  public async ajaxWebSiteViewTree(
    entity: ObjectTree,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
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
    let templateCss: string = genericObject.templateNode.contentGenericTemplate
      .css
      ? genericObject.templateNode.contentGenericTemplate.css
      : '';
    let response: string =
      '<div class="template_' +
      genericObject.templateNode.name +
      '">' +
      this.mustacheService.parse(
        mustache,
        genericObject,
        genericObject.templateNode.contentGenericTemplate.templatesMustache
          ? genericObject.templateNode.contentGenericTemplate.templatesMustache
          : {},
      ) +
      '</div>';
    if ('' !== templateCss) {
      const cssObject: css.Stylesheet = css.parse(templateCss);
      if (cssObject.stylesheet) {
        for (const oneRule of cssObject.stylesheet.rules) {
          const rule = oneRule as css.Rule;
          if (rule.selectors) {
            for (const index in rule.selectors) {
              rule.selectors[index] =
                '.template_' +
                genericObject.templateNode.name +
                ' ' +
                rule.selectors[index];
            }
          }
        }
      }
      templateCss = css.stringify(cssObject);
      response =
        `
        <style type="text/css">
        ` +
        templateCss +
        `
        </style>
        ` +
        response;
    }

    //console.log('GET', entity.id, pageTreeId, dataTreeId, response);

    return new TextGeneratedResponse(response);
  }
}
