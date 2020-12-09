import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {TransientEntityInterceptor} from '../../interceptors/transient-entity.interceptor';
import {TransientEntityService} from './transient-entity.service';
import {TransientNodeService} from './transient-node.service';
import {TransientTreeService} from './transient-tree.service';

export class TransientEntityProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('TransientEntityService', app);
    this.services.push({cls: TransientEntityService});
    this.services.push({cls: TransientTreeService});
    this.services.push({cls: TransientNodeService});

    this.interceptorsPrepend.push({
      id: 'TransientEntityInterceptor',
      interceptor: TransientEntityInterceptor,
    });
  }
}
