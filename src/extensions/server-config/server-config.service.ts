/* eslint-disable @typescript-eslint/no-explicit-any */
import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {ApplicationService, ObjectNodeService} from '../../services';
import {ObjectNode} from './../../models/object-node.model';
import {CurrentContext} from './../../services/application.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {ContentEncryptedObjectService} from './../content-encrypted-object/content-encrypted-object.definition';
import {
  SERVER_CONFIGURATION_TYPE,
  SERVER_CONFIG_PROVIDER,
} from './../server-config/server-config.const';

export class ServerConfigService {
  private properties: {
    [name: string]: any;
  } = {};
  constructor(
    @service(ApplicationService) private appCtx: ApplicationService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(ContentEncryptedObjectService)
    private contentEncryptedObjectService: ContentEncryptedObjectService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      SERVER_CONFIG_PROVIDER,
      ServerConfigService.name,
      'Add server config proprties definition',
      EntityName.objectNode,
      SERVER_CONFIGURATION_TYPE.name,
      this.completeServerConfigurationNode.bind(this),
    );
  }
  public async completeServerConfigurationNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    if (
      objectNode.entityCtx?.jsonSchema?.properties?.contentEncryptedObject
        ?.properties?.value
    ) {
      objectNode.entityCtx.jsonSchema.properties.contentEncryptedObject.properties.value.properties = this.properties;
      delete objectNode.entityCtx.jsonSchema.properties.contentEncryptedObject
        .properties.value['x-schema-form'];
    }
  }

  public async getConfig(): Promise<{[key: string]: any}> {
    const config = this.appCtx.getExtensionContext(SERVER_CONFIG_PROVIDER).nodes
      .serverConfiguration.value;
    if (!config) {
      return {};
    }
    const configObj: ObjectNode = await this.objectNodeService.searchById(
      config.id as string,
    );
    await this.contentEncryptedObjectService.addTransientContent(configObj);
    if (
      configObj?.contentEncryptedObject &&
      'value' in configObj.contentEncryptedObject
    ) {
      return configObj.contentEncryptedObject.value;
    }
    return {};
  }

  public async setConfig(configValue: any): Promise<void> {
    const config = this.appCtx.getExtensionContext(SERVER_CONFIG_PROVIDER).nodes
      .serverConfiguration.value;
    if (!config) {
      return;
    }
    const configObj: ObjectNode = await this.objectNodeService.searchById(
      config.id as string,
    );
    await this.contentEncryptedObjectService.manageContent(configObj, {
      contentEncryptedObject: {value: configValue},
    });
  }

  public async get(
    key: string,
    defaultValue?: () => Promise<any>,
  ): Promise<any> {
    const config = await this.getConfig();
    if (config && key in config) {
      return config[key];
    }
    if (undefined !== defaultValue) {
      config[key] = await defaultValue();
      await this.setConfig(config);
      return config[key];
    }
    return undefined;
  }

  public registerNewConfigurationKey(key: string, type: any) {
    this.properties[key] = type;
  }
}
