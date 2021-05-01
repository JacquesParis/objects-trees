/* eslint-disable @typescript-eslint/naming-convention */
import {
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
  Provider,
  service,
} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {getService} from '@loopback/service-proxy';
import {ServerConfigService} from '../../server-config/server-config.service';
import {GeocoderLocation, IGeocoderService} from '../geocoder.service';
import {CurrentContext} from './../../../services/application.service';
import {DATASTORE_NAME_GEOCODER_NOMINATIM} from './geocoder-nominatim.const';

const config = {
  name: DATASTORE_NAME_GEOCODER_NOMINATIM,
  connector: 'rest',
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url:
          'https://nominatim.openstreetmap.org/search.php?q={query:string}&polygon_geojson=1&format=jsonv2',
        headers: {
          referer: '{referer:string}',
          'user-agent': '{userAgent:string}',
        },
      },
      functions: {
        geocode: ['query', 'referer', 'userAgent'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class GeocoderNominatimDataSource
  extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = DATASTORE_NAME_GEOCODER_NOMINATIM;
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.' + DATASTORE_NAME_GEOCODER_NOMINATIM, {
      optional: true,
    })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}

export interface GeocoderNominatimRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geocode(
    address: string,
    referer: string,
    userAgent: string,
  ): Promise<
    {
      place_id: number;
      licence: string;
      osm_type: string;
      osm_id: number;
      boundingbox: [string, string, string, string];
      lat: string;
      lon: string;
      display_name: string;
      place_rank: number;
      category: string;
      type: string;
      importance: number;
      geojson: {type: string; coordinates: [number, number]};
    }[]
  >;
}

export class GeocoderNominatimRepositoryProvider
  implements Provider<GeocoderNominatimRepository> {
  constructor(
    // geocoder must match the name property in the datasource json file
    @inject('datasources.' + DATASTORE_NAME_GEOCODER_NOMINATIM)
    protected dataSource: GeocoderNominatimDataSource = new GeocoderNominatimDataSource(),
  ) {}

  value(): Promise<GeocoderNominatimRepository> {
    return getService(this.dataSource);
  }
}

export class GeocoderNominatimService implements IGeocoderService {
  constructor(
    @inject('services.GeocoderNominatimRepository')
    private geocoderRepository: GeocoderNominatimRepository,
    @service(ServerConfigService)
    private serverConfigService: ServerConfigService,
  ) {}

  getName(): string {
    return DATASTORE_NAME_GEOCODER_NOMINATIM;
  }
  public async getAddressLocation(
    address: string,
    isAddressUriEncoded = false,
    ctx: CurrentContext,
  ): Promise<GeocoderLocation> {
    const addressUriEncoded = isAddressUriEncoded
      ? address
      : encodeURIComponent(address);
    const referer = ctx.uriContext.uri.value.headers.referer
      ? ctx.uriContext.uri.value.headers.referer
      : ctx.uriContext.uri.value.protocol +
        '://' +
        ctx.uriContext.uri.value.host;
    const userAgent = ctx.uriContext.uri.value.headers['user-agent']
      ? ctx.uriContext.uri.value.headers['user-agent']
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36';
    const coordinates: {lat: string; lon: string} = (
      await this.geocoderRepository.geocode(
        addressUriEncoded,
        referer,
        userAgent,
      )
    )[0];
    return {
      latitude: parseFloat(coordinates.lat),
      longitude: parseFloat(coordinates.lon),
    };
  }
}
