import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {contentGenericTemplate} from '../../helper';
import {
  GeneratedResponse,
  TextGeneratedResponse,
} from '../../helper/generated-response';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {ObjectTypeService} from '../../services/object-type.service';
import {ApplicationError} from './../../helper/application-error';
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
import {AjaxGeneratedResult} from './modele/ajax-generated-result';
import {AjaxResult} from './modele/ajax-result';
import {WEB_SITE_PROVIDER, WEB_SITE_VIEW_TYPE} from './web-site.const';

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
    let result: GeneratedResponse = await this.ajaxWebSiteViewTree(
      entity,
      args,
      ctx,
    );
    if (result instanceof TextGeneratedResponse) {
      result = new HtmlGeneratedResponse(
        this.mustacheService.parse(this.doc.templateMustache, {
          body: result.response,
        }),
      );
    } else if (result instanceof JsonGeneratedResponse) {
      const docParts: AjaxResult = result.json;

      result = new HtmlGeneratedResponse(
        this.mustacheService.parse(this.doc.templateMustache, docParts),
      );
    }
    return result;
  }

  public async ajaxWebSiteViewTree(
    entity: ObjectTree,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
    const genericObject: AjaxGeneratedResult = new AjaxGeneratedResult(
      this.mustacheService,
      this.insideRestService,
      this.uriCompleteService,
      ctx,
    );

    try {
      await genericObject.init(entity.id, args[0], args[1], args[2]);
    } catch (error) {
      throw ApplicationError.notFound({
        url: entity.aliasUri ? entity.aliasUri : entity.uri,
      });
    }

    return new JsonGeneratedResponse<AjaxResult>(
      await genericObject.generate(),
    );
  }
}
