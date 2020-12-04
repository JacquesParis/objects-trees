import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ObjectTreeService} from './object-tree.service';

export class ObjectTreeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('ObjectTreeService', app);
    this.entities.services.push({cls: ObjectTreeService});
  }
}
