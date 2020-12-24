import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {InsideRestProvider} from './inside-rest.provider';
import {TRANSIENT_URI_PROVIDER} from './transient-uri-reference.const';
import {TransientUriReferenceService} from './transient-uri-reference.service';

export class TransientUriReferenceProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(TRANSIENT_URI_PROVIDER, app);
    this.requiredProviders.push(InsideRestProvider);
    this.services.push({cls: TransientUriReferenceService});
  }
}
