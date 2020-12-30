import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {RunnerTreatmentDescription} from './../../integration/extension-description';
import {EntityDefinitionInterceptor} from './../../interceptors/entity-definition.interceptor';
import {ENTITY_DEFINITION_PROVIDER} from './entity-definition.cont';
import {EntityDefinitionService} from './entity-definition.service';
import {ObjectNodeDefinitionService} from './object-node-definition.service';
import {ObjectTreeDefinitionService} from './object-tree-definition.service';

export class EntityDefinitionProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(ENTITY_DEFINITION_PROVIDER, app);
    this.services.push({cls: EntityDefinitionService});
    this.services.push({cls: ObjectNodeDefinitionService});
    this.services.push({cls: ObjectTreeDefinitionService});

    this.interceptorsPrepend.push({
      id: 'EntityDefinitionInterceptor',
      interceptor: EntityDefinitionInterceptor,
      description: {
        postTreatment: new RunnerTreatmentDescription(
          'Add Json Schema entity(ies) definition to returned entity(ies)',
          ['EntityDefinitionService'],
        ),
      },
    });
  }
}
