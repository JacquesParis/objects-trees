import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {EntityDefinitionInterceptor} from './../../interceptors/entity-definition.interceptor';
import {EntityDefinitionService} from './entity-definition.service';
import {ObjectNodeDefinitionService} from './object-node-definition.service';
import {ObjectTreeDefinitionService} from './object-tree-definition.service';

export class EntityDefinitionProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('EntityDefinitionService', app);
    this.services.push({cls: EntityDefinitionService});
    this.services.push({cls: ObjectNodeDefinitionService});
    this.services.push({cls: ObjectTreeDefinitionService});

    this.interceptorsPrepend.push({
      id: 'EntityDefinitionInterceptor',
      interceptor: EntityDefinitionInterceptor,
    });
  }
}
