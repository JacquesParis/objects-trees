import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {CONTENT_ENCRYPTED_OBJECT_PROVIDER} from './content-encrypted-object.const';
import {
  ContentEncryptedObject,
  ContentEncryptedObjectRepository,
  ContentEncryptedObjectService,
  EncryptedObject,
} from './content-encrypted-object.definition';

export class ContentEncryptedObjectProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CONTENT_ENCRYPTED_OBJECT_PROVIDER, app);
    this.models.push(EncryptedObject);
    this.models.push(ContentEncryptedObject);
    this.repositories.push({repoClass: ContentEncryptedObjectRepository});
    this.services.push({cls: ContentEncryptedObjectService});
  }
}
