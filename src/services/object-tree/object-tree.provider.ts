import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ObjectNode} from './../../models/object-node.model';
import {ApplicationService, CurrentContext} from './../application.service';
import {
  FOLDER_TYPE,
  OBJECT_TREE_PROVIDER,
  REPOSITORY_CATEGORY_TYPE,
  REPOSITORY_TYPE,
  TEMPLATES_OBJECT_NAME,
  TENANT_TYPE,
} from './object-tree.const';

export class ObjectTreeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(OBJECT_TREE_PROVIDER, app);

    this.objectTypes.repository = REPOSITORY_TYPE;
    this.objectTypes.folder = FOLDER_TYPE;
    this.objectTypes.tenant = TENANT_TYPE;
    this.objectTypes.repositoryCategory = REPOSITORY_CATEGORY_TYPE;
    this.objectSubTypes.push({
      typeName: REPOSITORY_TYPE.name,
      subTypeName: REPOSITORY_TYPE.name,
      acl: true,
      name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
      namespace: true,
      owner: true,
      tree: true,
    });
    this.objectSubTypes.push({
      typeName: REPOSITORY_TYPE.name,
      subTypeName: REPOSITORY_CATEGORY_TYPE.name,
      acl: true,
      name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
      namespace: true,
      owner: false,
      tree: true,
    });

    this.objectSubTypes.push({
      typeName: REPOSITORY_TYPE.name,
      subTypeName: TENANT_TYPE.name,
      acl: true,
      name: TENANT_TYPE.name,
      namespace: true,
      owner: true,
      tree: true,
    });

    this.objectSubTypes.push({
      typeName: FOLDER_TYPE.name,
      subTypeName: FOLDER_TYPE.name,
      acl: true,
      name: FOLDER_TYPE.name,
      namespace: true,
      owner: false,
      tree: true,
    });

    this.objectTrees.public = {
      parentNode: () => this.appCtx.rootNode.value,
      treeNodeTypeId: REPOSITORY_TYPE.name,
      treeNodeName: 'public',
      tree: {treeNode: {}, children: {}},
    };

    this.objectTrees.publicTemplates = {
      parentNode: () => this.appCtx.publicNode.value,
      treeNodeTypeId: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
      treeNodeName: TEMPLATES_OBJECT_NAME,
      tree: {treeNode: {}, children: {}},
    };
    this.objectTrees.demonstrationAccount = {
      parentNode: () => this.appCtx.rootNode.value,
      treeNodeTypeId: TENANT_TYPE.name,
      treeNodeName: 'Demonstration',
      tree: {treeNode: {}, children: {}},
    };
    this.objectTrees.demonstrationExamples = {
      parentNode: () => this.appCtx.demonstrationAccountNode.value,
      treeNodeTypeId: FOLDER_TYPE.name,
      treeNodeName: 'Examples',
      tree: {treeNode: {}, children: {}},
    };
    this.objectTrees.demonstrationSandbox = {
      parentNode: () => this.appCtx.demonstrationAccountNode.value,
      treeNodeTypeId: FOLDER_TYPE.name,
      treeNodeName: 'Sandbox',
      tree: {treeNode: {}, children: {}},
    };
  }

  public async beforeBoot(): Promise<void> {
    await this.appCtx.rootNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newRoot = await this.objectNodeService.searchOwner(
          ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
          ApplicationService.OBJECT_NODE_NAMES[
            ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
          ],
        );
        if (!newRoot) {
          newRoot = await this.objectNodeService.add(
            {
              name:
                ApplicationService.OBJECT_NODE_NAMES[
                  ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
                ],
              objectTypeId: REPOSITORY_TYPE.name,
              owner: true,
              tree: true,
              namesapce: true,
              acl: true,
            },
            new CurrentContext(),
            true,
          );
        }
        return newRoot;
      },
    );
    await super.beforeBoot();
  }
}
