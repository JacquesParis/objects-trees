import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {TransientEntityInterceptor} from '../../interceptors/transient-entity.interceptor';
import {TransientEntityService} from './transient-entity.service';
import {TransientNodeService} from './transient-node.service';
import {TransientTreeService} from './transient-tree.service';

export class TransientEntityProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('TransientEntityService', app);
    this.entities.services = [
      {cls: TransientEntityService},
      {cls: TransientTreeService},
      {cls: TransientNodeService},
    ];
    this.entities.interceptors.prepend = [
      {
        id: 'TransientEntityInterceptor',
        interceptor: TransientEntityInterceptor,
      },
    ];
  }
}
