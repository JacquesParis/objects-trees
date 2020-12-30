import {ObjectTreesApplicationInterface} from '../../application';
import {ExtensionProvider} from '../../integration/extension.provider';
import {ObjectNode} from './../../models/object-node.model';
import {
  ApplicationService,
  CurrentContext,
  ExpectedValue,
} from './../application.service';
import {ActionTreeService} from './action-tree.service';
import {
  FOLDER_FOLDER_SUBTYPE,
  FOLDER_TYPE,
  OBJECT_TREE_PROVIDER,
  REPOSITORY_CATEGORY_TYPE,
  REPOSITORY_REPOSITORY_CATEGORY_SUBTYPE,
  REPOSITORY_REPOSITORY_SUBTYPE,
  REPOSITORY_TENANT_SUBTYPE,
  REPOSITORY_TYPE,
  ROOT_TYPE,
  TEMPLATES_OBJECT_NAME,
  TENANT_TYPE,
} from './object-tree.const';

export class ObjectTreeProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(OBJECT_TREE_PROVIDER, app);

    this.services.push({cls: ActionTreeService});

    this.objectTypes.push(
      REPOSITORY_TYPE,
      FOLDER_TYPE,
      TENANT_TYPE,
      REPOSITORY_CATEGORY_TYPE,
      ROOT_TYPE,
    );
    this.objectSubTypes.push(
      REPOSITORY_REPOSITORY_SUBTYPE,
      REPOSITORY_REPOSITORY_CATEGORY_SUBTYPE,
      REPOSITORY_TENANT_SUBTYPE,
      FOLDER_FOLDER_SUBTYPE,
    );

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

  public async boot(): Promise<void> {
    await this.appCtx.rootNode.getOrSetValue(
      async (): Promise<ObjectNode> => {
        let newRoot = await this.objectNodeService.searchOwner(
          ROOT_TYPE.name,
          ApplicationService.OBJECT_NODE_NAMES[
            ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
          ],
        );
        if (!newRoot) {
          // Look for Convert Root Repository
          newRoot = await this.objectNodeService.searchOwner(
            REPOSITORY_TYPE.name,
            ApplicationService.OBJECT_NODE_NAMES[
              ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY
            ],
          );
          if (newRoot) {
            // Convert Root Repository to Root
            newRoot = await this.objectNodeService.modifyById(
              newRoot.id as string,
              {
                objectTypeId: ROOT_TYPE.name,
              },
              CurrentContext.get({
                nodeContext: {node: new ExpectedValue(newRoot)},
              }),
              true,
            );
          } else {
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
        }
        return newRoot;
      },
    );
    await super.boot();
  }
}
