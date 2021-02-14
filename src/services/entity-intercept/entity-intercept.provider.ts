import {ObjectTreesApplicationInterface} from '../../application.interface';
import {RunnerTreatmentDescription} from '../../integration/extension-description';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ENTITY_INTERCEPT_PROVIDER} from './entity-intercept.const';
import {EntityInterceptInterceptor} from './entity-intercept.interceptor';
import {EntityInterceptService} from './entity-intercept.service';
import {NodeInterceptService} from './node-intercept.service';

export class EntityInterceptProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(ENTITY_INTERCEPT_PROVIDER, app);
    this.services.push(
      {cls: EntityInterceptService},
      {cls: NodeInterceptService},
    );

    this.interceptorsPrepend.push({
      id: EntityInterceptInterceptor.name,
      interceptor: EntityInterceptInterceptor,
      description: {
        preTreatment: new RunnerTreatmentDescription(
          'Intercept incoming request',
          ['EntityInterceptService'],
        ),
      },
    });
  }
}
