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
import {CurrentContext} from '../../../services';
import {GeocoderLocation, IGeocoderService} from '../geocoder.service';
import {ApplicationError} from './../../../helper/application-error';
import {ServerConfigService} from './../../server-config/server-config.service';
import {DATASTORE_NAME_GEOCODER_POSITION_STACK} from './geocoder-position-stack.const';

const config = {
  name: DATASTORE_NAME_GEOCODER_POSITION_STACK,
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
          'http://api.positionstack.com/v1/forward?access_key={accessKey:string}&limit=1&output=json&query={query:string}',
      },
      functions: {
        geocode: ['accessKey', 'query'],
      },
    },
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class GeocoderPositionStackDataSource
  extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = DATASTORE_NAME_GEOCODER_POSITION_STACK;
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.' + DATASTORE_NAME_GEOCODER_POSITION_STACK, {
      optional: true,
    })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}

export interface GeocoderPositionStackRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geocode(
    apiKey: string,
    address: string,
  ): Promise<{
    data: [
      {
        latitude: number;
        longitude: number;
        type: string;
        name: string;
        number: string;
        postal_code: string;
        street: string;
        confidence: number;
        region: string;
        region_code: string;
        locality: string;
        administrative_area: string;
        neighbourhood: string;
        country: string;
        country_code: string;
        continent: string;
        label: string;
      },
    ];
  }>;
}

export class GeocoderPositionStackRepositoryProvider
  implements Provider<GeocoderPositionStackRepository> {
  constructor(
    // geocoder must match the name property in the datasource json file
    @inject('datasources.' + DATASTORE_NAME_GEOCODER_POSITION_STACK)
    protected dataSource: GeocoderPositionStackDataSource = new GeocoderPositionStackDataSource(),
  ) {}

  value(): Promise<GeocoderPositionStackRepository> {
    return getService(this.dataSource);
  }
}

export class GeocoderPositionStackService implements IGeocoderService {
  constructor(
    @inject('services.GeocoderPositionStackRepository')
    private geocoderRepository: GeocoderPositionStackRepository,
    @service(ServerConfigService)
    private serverConfigService: ServerConfigService,
  ) {
    this.serverConfigService.registerNewConfigurationKey(
      'positionStackApiKey',
      {type: 'string', title: 'positionStack Api Key'},
    );
  }
  getName(): string {
    return DATASTORE_NAME_GEOCODER_POSITION_STACK;
  }

  public async getAddressLocation(
    address: string,
    isAddressUriEncoded = false,
    ctx: CurrentContext,
  ): Promise<GeocoderLocation> {
    const addressUriEncoded = isAddressUriEncoded
      ? address
      : encodeURIComponent(address);
    const secret = await this.serverConfigService.get('positionStackApiKey');
    if (!secret) {
      throw ApplicationError.missingParameter(
        'serverConfigService.positionStackApiKey',
      );
    }
    return (await this.geocoderRepository.geocode(secret, addressUriEncoded))
      .data[0];
  }
}
