import {IJsonSchema, IObjectTree} from '@jacquesparis/objects-model';
import {AclCtx} from './acl-ctx.model';
import {EntityName} from './entity-name';
import {ObjectNode} from './object-node.model';
export class ObjectTree implements IObjectTree {
  children: ObjectTree[] = [];
  parentTree: ObjectTree;
  uri: string;
  id: string;
  parentTreeId: string;
  parentTreeUri: string;
  entityName: EntityName = EntityName.objectTree;
  entityCtx?: {
    entityDefinition?: IJsonSchema;
    aclCtx?: AclCtx;
  };

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
    if (this.treeNode.tree) {
      this.id = this.treeNode.id as string;
    }
    return this;
  }
}
