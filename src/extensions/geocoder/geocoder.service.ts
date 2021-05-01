/* eslint-disable @typescript-eslint/naming-convention */
import {service} from '@loopback/core';
import moment from 'moment';
import {
  GeneratedResponse,
  JsonGeneratedResponse,
} from '../../helper/generated-response';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {CurrentContext} from '../../services/application.service';
import {TENANT_TYPE} from '../../services/object-tree/object-tree.const';
import {ServerConfigService} from '../server-config/server-config.service';
import {ApplicationError} from './../../helper/application-error';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {CachedResultService} from './../cached-result/cached-result.service';
import {WEB_SITE_VIEW_TYPE} from './../web-site/web-site.const';
import {GEOCODER_PROVIDER} from './geocoder.const';

export interface IGeocoderService {
  getAddressLocation(
    addressUriEncoded: string,
    isAddressUriEncoded: boolean,
    ctx: CurrentContext,
  ): Promise<{latitude: number; longitude: number}>;
  getName(): string;
}

export class GeocoderService {
  services: IGeocoderService[] = [];
  constructor(
    @service(ServerConfigService)
    private serverConfigService: ServerConfigService,
    @service(ActionEntityService)
    private actionEntityService: ActionEntityService,
    @service(CachedResultService)
    private cachedResultService: CachedResultService,
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
  ) {
    this.actionEntityService.registerNewViewFunction(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Geocoder an address',
      EntityName.objectNode,
      'geocode',
      TENANT_TYPE.name,
      this.geocodeTenantNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewViewFunction(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Geocoder an address',
      EntityName.objectNode,
      'geocode',
      WEB_SITE_VIEW_TYPE.name,
      this.geocodeTenantNode.bind(this),
      'create',
    );
    this.actionEntityService.registerNewMethodFunction(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Geocoder an address',
      EntityName.objectNode,
      'geocode',
      WEB_SITE_VIEW_TYPE.name,
      this.geocodeTenantNodeFromPost.bind(this) as (
        entity: ObjectNode,
        args: Object,
        ctx: CurrentContext,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) => Promise<any>,
      'create',
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Add geocode method definition to get latitude and longitude from address',
      EntityName.objectNode,
      WEB_SITE_VIEW_TYPE.name,
      this.completeWebSiteViewTypeNode.bind(this),
    );
  }

  public registerService(geocoderService: IGeocoderService) {
    this.services.push(geocoderService);
  }
  public async completeWebSiteViewTypeNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    if (!objectNode.entityCtx?.actions) {
      objectNode.entityCtx.actions = {};
    }
    if (!objectNode.entityCtx.actions.methods) {
      objectNode.entityCtx.actions.methods = [];
    }
    objectNode.entityCtx.actions.methods.push({
      methodId: 'geocode',
      methodName: 'Locate an address',
      actionName: 'Locate this address',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            title: 'Address',
            required: true,
          },
        },
        icon: 'fas fa-search-location',
      },
    });
  }

  public async geocodeTenantNodeFromPost(
    objectNode: ObjectNode,
    args: {address: string},
    ctx: CurrentContext,
  ): Promise<{latitude: number; longitude: number}> {
    return this.getAddressLocation(args.address, ctx);
  }

  private async getAddressLocation(
    address: string,
    ctx: CurrentContext,
  ): Promise<{latitude: number; longitude: number}> {
    const result: {
      latitude: number;
      longitude: number;
    } = await this.cachedResultService.getResult<{
      latitude: number;
      longitude: number;
    }>(
      GeocoderService.name,
      {
        address: address
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(new RegExp('[^' + `A-Z|a-z|0-9|` + ']', 'g'), '_')
          .replace(/__+/g, '_'),
      },
      async () => {
        for (const geocoderService of this.services) {
          try {
            return await geocoderService.getAddressLocation(
              address,
              false,
              ctx,
            );
          } catch (error) {
            console.trace(geocoderService.getName(), error);
          }
        }
        throw ApplicationError.unexpectedError(
          new Error('geocoders not available'),
        );
      },
      moment.duration(2, 'month'),
    );
    return result;
  }

  public async geocodeTenantNode(
    entity: ObjectNode,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedResponse> {
    const address = await this.getAddressLocation(
      decodeURIComponent((args[0] as string).replace(/+/g, ' ')),
      ctx,
    );
    return new JsonGeneratedResponse(address);
  }
}
