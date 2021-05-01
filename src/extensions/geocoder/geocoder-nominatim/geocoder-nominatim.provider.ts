import {ObjectTreesApplicationInterface} from '../../../application.interface';
import {ExtensionProvider} from '../../../integration/extension.provider';
import {GeocoderProvider} from '../geocoder.provider';
import {GEOCODER_NOMINATIM_PROVIDER} from './geocoder-nominatim.const';
import {
  GeocoderNominatimDataSource,
  GeocoderNominatimRepositoryProvider,
  GeocoderNominatimService,
} from './geocoder-nominatim.service';

export class GeocoderNominatimProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(GEOCODER_NOMINATIM_PROVIDER, app);
    this.requiredProviders.push(GeocoderProvider);

    this.dataSources.push({
      dataSource: GeocoderNominatimDataSource,
      name: GeocoderNominatimDataSource.dataSourceName,
    });
    this.services.push(
      {cls: GeocoderNominatimRepositoryProvider},
      {cls: GeocoderNominatimService},
    );
  }
}
