import {ObjectTreesApplicationInterface} from '../../application.interface';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ContentEncryptedObjectProvider} from '../content-encrypted-object/content-encrypted-object.provider';
import {ROOT_CONFIG_PROVIDER} from './../../services/root-config/root-config.const';
import {RootConfigProvider} from './../../services/root-config/root-config.provider';
import {
  ROOT_CONFIGURATION_SERVER_CONFIGURATION_SUBTYPE,
  SERVER_CONFIGURATION_TYPE,
  SERVER_CONFIG_PROVIDER,
} from './server-config.const';
import {ServerConfigService} from './server-config.service';

export class ServerConfigProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(SERVER_CONFIG_PROVIDER, app);
    this.requiredProviders.push(
      RootConfigProvider,
      ContentEncryptedObjectProvider,
    );
    this.services.push({cls: ServerConfigService});
    this.objectTypes.push(SERVER_CONFIGURATION_TYPE);
    this.objectSubTypes.push(ROOT_CONFIGURATION_SERVER_CONFIGURATION_SUBTYPE);

    this.objectTrees.serverConfiguration = {
      parentNode: () =>
        this.appCtx.getExtensionContext(ROOT_CONFIG_PROVIDER).nodes
          .rootConfiguration.value,
      treeNodeTypeId: SERVER_CONFIGURATION_TYPE.name,
      treeNodeName: SERVER_CONFIGURATION_TYPE.name,
      tree: {treeNode: {}, children: {}},
    };
  }
}
