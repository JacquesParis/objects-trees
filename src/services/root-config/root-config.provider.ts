import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {
  ROOT_CONFIGURATION_TYPE,
  ROOT_CONFIG_PROVIDER,
  ROOT_ROOT_CONFIGURATION_SUBTYPE,
} from './root-config.const';
import {RootConfigService} from './root-config.service';

export class RootConfigProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(ROOT_CONFIG_PROVIDER, app);

    this.services.push({cls: RootConfigService});

    this.objectTypes.push(ROOT_CONFIGURATION_TYPE);
    this.objectSubTypes.push(ROOT_ROOT_CONFIGURATION_SUBTYPE);

    this.objectTrees.rootConfiguration = {
      parentNode: () => this.appCtx.rootNode.value,
      treeNodeTypeId: ROOT_CONFIGURATION_TYPE.name,
      treeNodeName: ROOT_CONFIGURATION_TYPE.name,
      tree: {treeNode: {}, children: {}},
    };
  }
}
