import {IEntityContext, IObjectTree} from '@jacquesparis/objects-model';
import {AccessRightsScope} from './../services/access-rights/access-rights.const';
import {EntityName} from './entity-name';
import {ObjectNode} from './object-node.model';

export class ObjectTree implements IObjectTree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  children: ObjectTree[] = [];
  childrenEntityCtx: {
    [objectTypeId: string]: {
      aclCtx: {
        rights: {[scope in AccessRightsScope]?: boolean};
      };
    };
  };
  parentTree?: ObjectTree;
  uri: string;
  aliasUri?: string;
  id: string;
  ownerType?: string;
  ownerName?: string;
  namespaceType?: string;
  namespaceName?: string;
  treeType?: string;
  treeName?: string;
  parentTreeId?: string;
  parentTreeUri?: string;
  entityName: EntityName = EntityName.objectTree;
  entityCtx?: IEntityContext;

  constructor(public treeNode: ObjectNode) {}

  public get childrenByObjectTypeId(): {[objectTypeId: string]: ObjectTree[]} {
    const result: {[objectTypeId: string]: ObjectTree[]} = {};
    for (const child of this.children) {
      if (!(child.treeNode.objectTypeId in result)) {
        result[child.treeNode.objectTypeId as string] = [];
      }
      result[child.treeNode.objectTypeId as string].push(child);
    }
    return result;
  }

  async init(
    allNodes: ObjectNode[],
    //   contentEntityService: ContentEntityService,
    // objectTypes: {[id: string]: ObjectType},
  ): Promise<ObjectTree> {
    /* await contentEntityService.addTransientContent(
      objectTypes[this.treeNode.objectTypeId]?.contentType,
      this.treeNode,
    );*/
    for (const otherNode of allNodes) {
      if (otherNode.parentNodeId === this.treeNode.id) {
        this.children.push(
          await new ObjectTree(otherNode).init(
            allNodes,
            //      contentEntityService,
            //       objectTypes,
          ),
        );
      }
    }
    this.id = this.treeNode.id as string;
    return this;
  }
}

export class ObjectNodeTree<T extends ObjectNode> extends ObjectTree {
  treeNode: T;
}
