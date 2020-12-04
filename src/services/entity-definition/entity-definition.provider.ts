import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {EntityDefinitionInterceptor} from './../../interceptors/entity-definition.interceptor';
import {EntityDefinitionService} from './entity-definition.service';
import {ObjectNodeDefinitionService} from './object-node-definition.service';

export class EntityDefinitionProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('EntityDefinitionService', app);
    this.entities.services = [
      {cls: EntityDefinitionService},
      {cls: ObjectNodeDefinitionService},
    ];
    this.entities.interceptors.prepend = [
      {
        id: 'EntityDefinitionInterceptor',
        interceptor: EntityDefinitionInterceptor,
      },
    ];
  }
}
