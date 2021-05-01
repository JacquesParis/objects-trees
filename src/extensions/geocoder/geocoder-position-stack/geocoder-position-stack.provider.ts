import {ObjectTreesApplicationInterface} from '../../../application.interface';
import {ExtensionProvider} from '../../../integration/extension.provider';
import {GeocoderProvider} from '../geocoder.provider';
import {GEOCODER_POSITION_STACK_PROVIDER} from './geocoder-position-stack.const';
import {GeocoderPositionStackDataSource} from './geocoder-position-stack.service';

export class GeocoderPositionStackProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(GEOCODER_POSITION_STACK_PROVIDER, app);
    this.requiredProviders.push(GeocoderProvider);

    this.dataSources.push({
      dataSource: GeocoderPositionStackDataSource,
      name: GeocoderPositionStackDataSource.dataSourceName,
    });
    /*
    this.services.push(
      {cls: GeocoderPositionStackRepositoryProvider},
      {cls: GeocoderPositionStackService},
    );
    */
  }
}
