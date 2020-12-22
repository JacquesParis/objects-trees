import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {UriCompleteInterceptor} from './../../interceptors/uri-complete.interceptor';
import {UriCompleteService} from './uri-complete.service';

export class UriCompleteProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('UriCompleteService', app);

    this.services.push({cls: UriCompleteService});

    this.interceptorsAppend.push({
      id: 'UriCompleteInterceptor',
      interceptor: UriCompleteInterceptor,
    });
  }
}
