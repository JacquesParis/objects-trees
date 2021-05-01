import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ServerConfigProvider} from './../server-config/server-config.provider';
import {CACHED_RESULT_PROVIDER} from './cached-result.const';
import {CachedResult} from './cached-result.model';
import {CachedResultRepository} from './cached-result.repository';
import {CachedResultService} from './cached-result.service';

export class CachedResultProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CACHED_RESULT_PROVIDER, app);
    this.requiredProviders.push(ServerConfigProvider);
    this.models.push(CachedResult);
    this.repositories.push({repoClass: CachedResultRepository});
    this.services.push({cls: CachedResultService});
  }
}
