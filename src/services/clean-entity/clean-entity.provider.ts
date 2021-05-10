import {ObjectTreesApplicationInterface} from '../../application.interface';
import {RunnerTreatmentDescription} from '../../integration/extension-description';
import {ExtensionProvider} from '../../integration/extension.provider';
import {CLEAN_ENTITY_PROVIDER} from './clean-entity.const';
import {
  CleanEntityInterceptor,
  CleanEntityService,
} from './clean-entity.service';

export class CleanEntityProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CLEAN_ENTITY_PROVIDER, app);
    this.services.push({cls: CleanEntityService});

    this.interceptorsPrepend.push({
      id: 'CleanEntityInterceptor',
      interceptor: CleanEntityInterceptor,
      description: {
        postTreatment: new RunnerTreatmentDescription('Clean returned objects'),
      },
    });
  }
}
