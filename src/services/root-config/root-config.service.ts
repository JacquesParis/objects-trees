import {service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {ApplicationService, CurrentContext} from '../application.service';
import {TransientEntityService} from '../transient-entity/transient-entity.service';
import {ObjectTree} from './../../models/object-tree.model';
import {
  ROOT_CONFIGURATION_TYPE,
  ROOT_CONFIG_PROVIDER,
} from './root-config.const';
export class RootConfigService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @service(ApplicationService) protected appCtx: ApplicationService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      ROOT_CONFIG_PROVIDER,
      RootConfigService.name,
      'Add Object Tree Configuration Summary',
      EntityName.objectNode,
      ROOT_CONFIGURATION_TYPE.name,
      this.completeRootConfigurationNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      ROOT_CONFIG_PROVIDER,
      RootConfigService.name,
      'Change access rights of Object Tree Configuration Summary',
      EntityName.objectTree,
      ROOT_CONFIGURATION_TYPE.name,
      this.completeRootConfigurationTree.bind(this),
    );
  }

  async completeRootConfigurationTree(object: ObjectTree, ctx: CurrentContext) {
    if (object.entityCtx) {
      if (object.entityCtx.aclCtx) {
        object.entityCtx.aclCtx.rights.update = false;
        object.entityCtx.aclCtx.rights.delete = false;
      }
    }
  }

  async completeRootConfigurationNode(object: ObjectNode, ctx: CurrentContext) {
    if (object.entityCtx) {
      if (object.entityCtx.aclCtx) {
        object.entityCtx.aclCtx.rights.update = false;
        object.entityCtx.aclCtx.rights.delete = false;
      }
      if (object.entityCtx.jsonSchema?.properties) {
        object.entityCtx.jsonSchema.properties.configSummary = {
          type: 'string',
          'x-schema-form': {
            type: 'textarea',
            readonly: true,
            disabled: true,
          },
        };
        object.configSummary = this.appCtx.configSummary.descriptionLines.join(
          '\r\n',
        );
      }
    }
  }
}
