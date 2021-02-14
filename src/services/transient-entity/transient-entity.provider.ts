import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {TransientEntityInterceptor} from '../../interceptors/transient-entity.interceptor';
import {RunnerTreatmentDescription} from './../../integration/extension-description';
import {TRANSIENT_ENTITY_PROVIDER} from './transient-entity.const';
import {TransientEntityService} from './transient-entity.service';
import {TransientNodeService} from './transient-node.service';
import {TransientTreeService} from './transient-tree.service';

export class TransientEntityProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(TRANSIENT_ENTITY_PROVIDER, app);
    this.services.push({cls: TransientEntityService});
    this.services.push({cls: TransientTreeService});
    this.services.push({cls: TransientNodeService});

    this.interceptorsPrepend.push({
      id: 'TransientEntityInterceptor',
      interceptor: TransientEntityInterceptor,
      description: {
        postTreatment: new RunnerTreatmentDescription(
          'Add transient data to returned entity(ies)',
          ['TransientEntityService'],
        ),
      },
    });
  }
}
