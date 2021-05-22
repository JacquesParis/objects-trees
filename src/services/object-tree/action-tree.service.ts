import {service} from '@loopback/core';
import {ActionEntityService} from '../action-entity/action-entity.service';
import {CurrentContext, ExpectedValue} from '../application.service';
import {ApplicationError} from './../../helper/application-error';
import {EntityName} from './../../models/entity-name';
import {ObjectTree} from './../../models/object-tree.model';
import {MethodAndViewEntityInterface} from './../action-entity/action-entity.service';
import {ApplicationService} from './../application.service';
import {InsideRestService} from './../inside-rest/inside-rest.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {OBJECT_TREE_PROVIDER} from './object-tree.const';

export class SortMethod implements MethodAndViewEntityInterface {
  providerId: string = OBJECT_TREE_PROVIDER;
  serviceId: string = ActionTreeService.name;
  description = 'Sort tree children nodes';
  accessRightsScope = 'create';
  constructor(protected objectNodeService: ObjectNodeService) {}
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
          CurrentContext.get(ctx, {
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
class MoveToMethod implements MethodAndViewEntityInterface {
  providerId: string = OBJECT_TREE_PROVIDER;
  serviceId: string = ActionTreeService.name;
  description = 'Move tree branch';
  accessRightsScope = 'delete';
  constructor(
    protected objectNodeService: ObjectNodeService,
    protected applicationService: ApplicationService,
  ) {}
  async runMethod(
    objectTree: ObjectTree,
    target: {targetId: string; targetUri: string},
    ctx: CurrentContext,
  ): Promise<void> {
    const insideRestService: InsideRestService = await this.applicationService.app.getService<InsideRestService>(
      InsideRestService,
    );
    const targetTree: ObjectTree = (await insideRestService.read(
      target.targetUri,
      ctx,
    )) as ObjectTree;
    if (
      !targetTree?.entityCtx?.actions?.creations ||
      !(
        objectTree.treeNode.objectTypeId in
        targetTree.entityCtx.actions.creations
      )
    ) {
      throw ApplicationError.incompatible({
        sourceName: objectTree.treeNode.name,
        targetUri: target.targetUri,
      });
    }
    await this.objectNodeService.moveTo(
      objectTree.treeNode,
      targetTree.treeNode,
    );
  }
  async hasMethod(
    objectTree: ObjectTree,
    ctx: CurrentContext,
  ): Promise<boolean> {
    return true;
  }
}
export class ActionTreeService {
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ApplicationService)
    protected applicationService: ApplicationService,
  ) {
    this.actionEntityService.registerNewMethodOrView(
      EntityName.objectTree,
      'sort',
      new SortMethod(objectNodeService),
    );
    this.actionEntityService.registerNewMethodOrView(
      EntityName.objectTree,
      'moveTo',
      new MoveToMethod(objectNodeService, applicationService),
    );
  }
}
