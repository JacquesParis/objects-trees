import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';

export class ObjectTreeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('ObjectTreeService', app);
  }
}
