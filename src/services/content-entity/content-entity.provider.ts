import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ObjectTreeProvider} from './../object-tree/object-tree.provider';
import {ContentFileService} from './content-file.service';
import {ContentTextService} from './content-text.service';
import {ContentUserService} from './content-user.service';

export class ContentEntityCoreProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('ContentEntityCore', app);
    this.requiredProviders.push(ObjectTreeProvider);
    this.services.push({cls: ContentFileService});
    this.services.push({cls: ContentTextService});
    this.services.push({cls: ContentUserService});
  }
}
