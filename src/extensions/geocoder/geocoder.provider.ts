import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {CachedResultProvider} from '../cached-result/cached-result.provider';
import {ServerConfigProvider} from '../server-config/server-config.provider';
import {GeocoderNominatimProvider} from './geocoder-nominatim/geocoder-nominatim.provider';
import {GeocoderNominatimService} from './geocoder-nominatim/geocoder-nominatim.service';
import {GeocoderPositionStackProvider} from './geocoder-position-stack/geocoder-position-stack.provider';
import {GeocoderPositionStackService} from './geocoder-position-stack/geocoder-position-stack.service';
import {GEOCODER_PROVIDER} from './geocoder.const';
import {GeocoderService} from './geocoder.service';

export class GeocoderProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(GEOCODER_PROVIDER, app);
    this.requiredProviders.push(
      ServerConfigProvider,
      CachedResultProvider,
      GeocoderPositionStackProvider,
      GeocoderNominatimProvider,
    );
    this.services.push({cls: GeocoderService});
  }

  //  await this.app.getService(serviceProvider.cls);}
  async boot(): Promise<void> {
    await super.boot();
    const service: GeocoderService = await this.app.getService<GeocoderService>(
      GeocoderService,
    );
    service.registerService(
      await this.app.getService<GeocoderPositionStackService>(
        GeocoderPositionStackService,
      ),
    );
    service.registerService(
      await this.app.getService<GeocoderNominatimService>(
        GeocoderNominatimService,
      ),
    );
  }
}
