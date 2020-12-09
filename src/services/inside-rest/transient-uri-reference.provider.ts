import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {InsideRestProvider} from './inside-rest.procider';
import {TransientUriReferenceService} from './transient-uri-reference.service';

export class TransientUriReferenceProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('TransientUriReferenceService', app);
    this.requiredProviders.push(InsideRestProvider);
    this.services.push({cls: TransientUriReferenceService});
  }
}
