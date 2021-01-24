import {service} from '@loopback/core';
import {ActionEntityService} from '../action-entity/action-entity.service';
import {CurrentContext, ExpectedValue} from '../application.service';
import {EntityName} from './../../models/entity-name';
import {ObjectTree} from './../../models/object-tree.model';
import {MethodAndViewEntityInterface} from './../action-entity/action-entity.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {OBJECT_TREE_PROVIDER} from './object-tree.const';
export class ActionTreeService implements MethodAndViewEntityInterface {
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
  ) {
    this.actionEntityService.registerNewMethodOrView(
      EntityName.objectTree,
      'sort',
      this,
    );
  }
  providerId: string = OBJECT_TREE_PROVIDER;
  serviceId: string = ActionTreeService.name;
  description = 'Sort tree children nodes';
  accessRightsScope = 'create';
  async runMethod(
    objectTree: ObjectTree,
    childrenIds: string[],
    ctx: CurrentContext,
  ): Promise<void> {
    for (let childIndex = 0; childIndex < childrenIds.length; childIndex++) {
      const childId = childrenIds[childIndex];
      const child = objectTree.children.find(
        (tree) => childId === tree.treeNode.id,
      );
      if (child && childIndex * 10 + 10 !== child.treeNode.index) {
        child.treeNode = await this.objectNodeService.modifyById(
          child.treeNode.id as string,
          {index: childIndex * 10 + 10},
          CurrentContext.get({
            nodeContext: {node: new ExpectedValue(child?.treeNode)},
          }),
          true,
        );
      }
    }
    objectTree.children.sort(
      (a, b) =>
        (undefined === a.treeNode?.index ? 1000 : a.treeNode.index) -
        (undefined === b.treeNode?.index ? 1000 : b.treeNode.index),
    );
  }
  async hasMethod(
    objectTree: ObjectTree,
    ctx: CurrentContext,
  ): Promise<boolean> {
    return true;
  }
}
