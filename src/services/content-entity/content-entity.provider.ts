import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ContentFileService} from './content-file.service';
import {ContentTextService} from './content-text.service';
import {ContentUserService} from './content-user.service';

export class ContentEntityCoreProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super('ContentEntityCore', app);
    this.entities.services = [
      {cls: ContentFileService},
      {cls: ContentTextService},
      {cls: ContentUserService},
    ];
  }
}
