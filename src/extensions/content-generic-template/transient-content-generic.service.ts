import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {indexOf, isArray, merge} from 'lodash';
import {addCondition} from '../../helper';
import {EntityName} from '../../models';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../../services';
import {ObjectNodeDefinitionService} from '../../services/entity-definition/object-node-definition.service';
import {InsideRestService} from '../../services/inside-rest/inside-rest.service';
import {TransientUriReferenceService} from '../../services/inside-rest/transient-uri-reference.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {TransientEntityService} from '../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from '../../services/uri-complete/uri-complete.service';
import {
  CONTENT_GENERIC_PROVIDER,
  TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE,
  TEMPLATE_VIEW_TYPE,
} from './content-generic-template.const';

export class TransientContentGenericService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectNodeDefinitionService)
    private objectNodeDefinitionService: ObjectNodeDefinitionService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(TransientUriReferenceService)
    private transientUriReferenceService: TransientUriReferenceService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CONTENT_GENERIC_PROVIDER,
      TransientContentGenericService.name,
      'Add template configuration json schema definitions, configuration from referenced templates',
      EntityName.objectNode,
      TEMPLATE_REFERER_WITH_CONFIGURATION_TYPE.name,
      this.completeTemplateRefererNode.bind(this),
    );
  }

  async completeTemplateRefererNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    for (const key of Object.keys(objectNode)) {
      if (
        key + 'Id' in objectNode &&
        objectNode[key].entityCtx &&
        -1 <
          indexOf(
            objectNode[key].entityCtx.implementedTypes,
            TEMPLATE_VIEW_TYPE.name,
          )
      ) {
        await this.addTemplateConfiguration(
          objectNode.entityCtx?.jsonSchema,
          key + 'Id',
          'model',
          ctx,
        );
      }
    }
  }

  async addTemplateConfiguration(
    templateRefJsonSchema: IJsonSchema | undefined,
    templateKeyId: string,
    templateParentJsonPath: string,
    ctx: CurrentContext,
  ) {
    if (
      templateRefJsonSchema?.properties &&
      templateRefJsonSchema.properties[templateKeyId] &&
      isArray(templateRefJsonSchema.properties[templateKeyId].oneOf) &&
      0 < templateRefJsonSchema.properties[templateKeyId].oneOf.length
    ) {
      for (const templateEnum of templateRefJsonSchema.properties[templateKeyId]
        .oneOf) {
        const templateTreeId = templateEnum.enum[0];
        const template = ctx.nodeContext.references[templateTreeId]?.value;
        if (template) {
          if (!template.contentGenericTemplate) {
            template.contentGenericTemplate = {};
            await this.transientEntityService.completeReturnedEntity(
              EntityName.objectNode,
              template,
              CurrentContext.get({
                nodeContext: {
                  node: ctx.nodeContext.references[templateTreeId],
                },
              }),
            );
          }
          await this.addTemplateConfigurationProperties(
            template,
            templateParentJsonPath + '.' + templateKeyId,
            templateTreeId,
            templateRefJsonSchema,
            ctx,
          );
        }
      }
    }
  }

  private async addTemplateConfigurationProperties(
    templateView: ObjectNode,
    templateJsonPath: string,
    templateObjectTreeId: string,
    jsonSchema: IJsonSchema | undefined,
    ctx: CurrentContext,
  ) {
    if (
      jsonSchema &&
      templateView?.contentGenericTemplate?.refererConfig?.properties &&
      0 <
        Object.keys(
          templateView?.contentGenericTemplate?.refererConfig?.properties,
        ).length
    ) {
      if (!jsonSchema.properties.templatesConfigurations) {
        jsonSchema.properties.templatesConfigurations = {
          type: 'object',
          title: 'Object template configurattion',
          'x-schema-form': {labelHtmlClass: 'd-none'},
          properties: {},
        };
      }
      if (jsonSchema?.properties?.templatesConfigurations.properties) {
        jsonSchema.properties.templatesConfigurations.properties[
          templateView.name
        ] = merge(
          {
            type: 'object',
            'x-schema-form': {labelHtmlClass: 'd-none'},
          },
          templateView.contentGenericTemplate.refererConfig,
        );
        addCondition(
          templateJsonPath + "=='" + templateObjectTreeId + "'",
          jsonSchema.properties.templatesConfigurations.properties[
            templateView.name
          ],
        );

        if (
          jsonSchema.properties.templatesConfigurations.properties[
            templateView.name
          ].properties
        ) {
          await this.objectNodeDefinitionService.completeProperties(
            jsonSchema.properties.templatesConfigurations.properties[
              templateView.name
            ].properties,
            ctx.nodeContext,
          );
        }
      }
    }
  }
}
