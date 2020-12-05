import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {ObjectTree} from '../../models/object-tree.model';
import {CurrentContext} from '../application.service';
import {ObjectTypeService} from '../object-type.service';
import {NodeContext} from './../application.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {
  EntityDefinitionInterface,
  EntityDefinitionService,
} from './entity-definition.service';
import {ObjectNodeDefinitionService} from './object-node-definition.service';

export class ObjectTreeDefinitionService implements EntityDefinitionInterface {
  constructor(
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ObjectNodeDefinitionService)
    protected objectNodeDefinitionService: ObjectNodeDefinitionService,
    @service(EntityDefinitionService)
    protected entityDefinitionService: EntityDefinitionService,
  ) {
    this.entityDefinitionService.registerEntityDefinitionService(
      EntityName.objectTree,
      this,
    );
  }
  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectTree = entity as ObjectTree;
    //this.entityCtx?.entityDefinition
    if (!objectTree.entityCtx) {
      objectTree.entityCtx = {};
    }
    // _.merge({}, this.entityDefinition, objectType.definition, this.entityDefinition, objectType.contentDefinition),

    const treeType = await ctx.treeContext.treeType.getOrSetValue(async () => {
      return this.objectTypeService.searchById(
        objectTree.treeNode.objectTypeId,
      );
    });
    if (!objectTree.entityCtx.actions) {
      objectTree.entityCtx.actions = {};
    }
    if (!objectTree.entityCtx.actions.creations) {
      objectTree.entityCtx.actions.creations = {};
    }
    const childContext = new NodeContext();
    childContext.brothers.value = ctx.treeContext.treeChildren.value;
    if (
      treeType.objectSubTypes &&
      objectTree.entityCtx?.aclCtx?.rights?.create
    ) {
      for (const subType of treeType.objectSubTypes) {
        try {
          childContext.objectSubType.value = subType;
          await this.objectNodeService.checkBrothersCondition(
            entity.id as string,
            childContext,
          );
          objectTree.entityCtx.actions.creations[
            subType.subObjectTypeId
          ] = await this.objectNodeDefinitionService.getObjectNodeDefinition(
            await this.objectTypeService.searchById(subType.subObjectTypeId),
          );

          // eslint-disable-next-line no-empty
        } catch (error) {}
      }
    }

    objectTree.entityCtx.actions.reads = [];

    const knownSubObjectTypeIds: string[] = treeType.objectSubTypes
      ? treeType.objectSubTypes.map((subType) => subType.subObjectTypeId)
      : [];
    if (objectTree.children) {
      for (const child of objectTree.children) {
        if (
          -1 ===
            objectTree.entityCtx.actions.reads.indexOf(
              child.treeNode.objectTypeId,
            ) &&
          -1 < knownSubObjectTypeIds.indexOf(child.treeNode.objectTypeId)
        ) {
          objectTree.entityCtx.actions.reads.push(child.treeNode.objectTypeId);
        }
      }
    }
    for (const childCreationObjectTypeId of Object.keys(
      objectTree.entityCtx.actions.creations,
    )) {
      if (
        -1 ===
        objectTree.entityCtx.actions.reads.indexOf(childCreationObjectTypeId)
      ) {
        objectTree.entityCtx.actions.reads.push(childCreationObjectTypeId);
      }
    }
  }
}
