import {IObjectTree} from '@jacquesparis/objects-model';
import {ContentEntityService} from './../services/content-entity.service';
import {EntityName} from './entity-name';
import {ObjectNode} from './object-node.model';
import {ObjectType} from './object-type.model';
export class ObjectTree implements IObjectTree {
  children: ObjectTree[] = [];
  parentTree: ObjectTree;
  uri: string;
  id: string;
  parentTreeId: string;
  parentTreeUri: string;
  entityName: EntityName = EntityName.objectTree;
  constructor(public treeNode: ObjectNode) {}

  async init(
    allNodes: ObjectNode[],
    contentEntityService: ContentEntityService,
    objectTypes: {[id: string]: ObjectType},
  ): Promise<ObjectTree> {
    await contentEntityService.addTransientContent(
      objectTypes[this.treeNode.objectTypeId]?.contentType,
      this.treeNode,
    );
    for (const otherNode of allNodes) {
      if (otherNode.parentNodeId === this.treeNode.id) {
        this.children.push(
          await new ObjectTree(otherNode).init(
            allNodes,
            contentEntityService,
            objectTypes,
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
