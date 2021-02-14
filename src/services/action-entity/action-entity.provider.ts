import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ACTION_ENTITY_PROVIDER} from './action-entity.const';
import {ActionEntityController} from './action-entity.controller';
import {ActionEntityService} from './action-entity.service';

export class ActionEntityProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(ACTION_ENTITY_PROVIDER, app);
    this.controllers.push({
      controllerCtor: ActionEntityController,
      description: {
        description: 'Add ObjectNode and ObjectTree method support',
        services: ['ActionEntityService'],
      },
    });
    this.services.push({cls: ActionEntityService});
  }
}
