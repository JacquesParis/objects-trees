import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {RunnerTreatmentDescription} from './../../integration/extension-description';
import {UriCompleteInterceptor} from './../../interceptors/uri-complete.interceptor';
import {URI_COMPLETE_PROVIDER} from './uri-complete.const';
import {UriCompleteService} from './uri-complete.service';

export class UriCompleteProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(URI_COMPLETE_PROVIDER, app);

    this.services.push({cls: UriCompleteService});

    this.interceptorsAppend.push({
      id: 'UriCompleteInterceptor',
      interceptor: UriCompleteInterceptor,

      description: {
        postTreatment: new RunnerTreatmentDescription(
          'Add Uri references to Entities base on the id and the type of Entity',
        ),
      },
    });
  }
}
