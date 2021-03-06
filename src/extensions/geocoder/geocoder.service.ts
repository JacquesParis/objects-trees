/* eslint-disable @typescript-eslint/naming-convention */
import {service} from '@loopback/core';
import moment from 'moment';
import {
  GeneratedResponse,
  JsonGeneratedResponse,
} from '../../helper/generated-response';
import {SimpleMethodValueResult} from '../../helper/method-value-result';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {CurrentContext} from '../../services/application.service';
import {TENANT_TYPE} from '../../services/object-tree/object-tree.const';
import {ServerConfigService} from '../server-config/server-config.service';
import {ApplicationError} from './../../helper/application-error';
import {MethodValueSimpleJsonResult} from './../../helper/method-value-result';
import {ObjectTree} from './../../models/object-tree.model';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {CachedResultService} from './../cached-result/cached-result.service';
import {WEB_SITE_VIEW_TYPE} from './../web-site/web-site.const';
import {GEOCODER_PROVIDER} from './geocoder.const';

export class GeocoderLocation extends MethodValueSimpleJsonResult {
  latitude: number;
  longitude: number;
}
export class GeocoderResult extends SimpleMethodValueResult<GeocoderLocation> {
  protected buildDisplayedValue(jsonResult: GeocoderLocation): string {
    let lines = super.buildDisplayedValue(jsonResult);

    lines += `
    <div class="mapouter">
      <div class="gmap_canvas">
        <iframe width="100%" height="318" id="gmap_canvas" src="https://maps.google.com/maps?q=${jsonResult.latitude},${jsonResult.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0">
        </iframe>
        <style>
          .mapouter{position:relative;text-align:right;height:318px;width:100%px;}
        </style>
        <style>
          .gmap_canvas {overflow:hidden;background:none!important;height:318px;width:100%px;}
        </style>
      </div>
    </div>
    `;
    return lines;
  }
}

export interface IGeocoderService {
  getAddressLocation(
    addressUriEncoded: string,
    isAddressUriEncoded: boolean,
    ctx: CurrentContext,
  ): Promise<GeocoderLocation>;
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
    this.actionEntityService.registerNewMethodFunction<ObjectNode>(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Geocoder an address',
      EntityName.objectNode,
      'geocode',
      WEB_SITE_VIEW_TYPE.name,
      this.geocodeTenantNodeFromPostOrTree.bind(this) as (
        entity: ObjectNode,
        args: Object,
        ctx: CurrentContext,
      ) => Promise<GeocoderResult>,
      'create',
    );
    this.actionEntityService.registerNewMethodFunction<ObjectTree>(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Geocoder an address',
      EntityName.objectTree,
      'geocode',
      WEB_SITE_VIEW_TYPE.name,
      this.geocodeTenantNodeFromPostOrTree.bind(this) as (
        entity: ObjectTree,
        args: Object,
        ctx: CurrentContext,
      ) => Promise<GeocoderResult>,
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

    this.transientEntityService.registerTransientEntityTypeFunction(
      GEOCODER_PROVIDER,
      GeocoderService.name,
      'Add geocode method definition to get latitude and longitude from address',
      EntityName.objectTree,
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
      },
      icon: 'fas fa-search-location',
    });
  }

  public async geocodeTenantNodeFromPostOrTree(
    objectNode: ObjectNode | ObjectTree,
    args: {address: string},
    ctx: CurrentContext,
  ): Promise<GeocoderResult> {
    const geolocation = await this.getAddressLocation(args.address, ctx);
    return new GeocoderResult(geolocation);
  }

  private async getAddressLocation(
    address: string,
    ctx: CurrentContext,
  ): Promise<GeocoderLocation> {
    const result: GeocoderLocation = await this.cachedResultService.getResult<GeocoderLocation>(
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
