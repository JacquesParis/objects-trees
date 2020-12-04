import {IJsonSchema, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {merge} from 'lodash';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {CurrentContext, NodeContext} from './../application.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {ObjectTypeService} from './../object-type.service';
import {
  EntityDefinitionInterface,
  EntityDefinitionService,
} from './entity-definition.service';

export const OBJECT_NODE_SCHEMA: IJsonSchema = {
  properties: {
    name: {
      type: 'string',
      // tslint:disable-next-line: object-literal-sort-keys
      title: 'Name',
      default: '',
      minLength: 3,
      required: true,
    },
  },
};

export class ObjectNodeDefinitionService implements EntityDefinitionInterface {
  constructor(
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(EntityDefinitionService)
    protected entityDefinitionService: EntityDefinitionService,
  ) {
    this.entityDefinitionService.registerEntityDefinitionService(
      EntityName.objectNode,
      this,
    );
  }
  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectNode = entity as ObjectNode;
    //this.entityCtx?.entityDefinition
    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {};
    }
    // _.merge({}, this.entityDefinition, objectType.definition, this.entityDefinition, objectType.contentDefinition),
    const objectType = await ctx.nodeContext.objectType.getOrSetValue(
      async () => {
        return this.objectTypeService.searchById(objectNode.objectTypeId);
      },
    );
    objectNode.entityCtx.entityDefinition = this.getObjectNodeDefinition(
      objectType,
    );
    if (!objectNode.entityCtx.actions) {
      objectNode.entityCtx.actions = {};
    }
    if (!objectNode.entityCtx.actions.creations) {
      objectNode.entityCtx.actions.creations = {};
    }
    const childContext = new NodeContext();
    if (objectNode.entityCtx?.aclCtx?.rights?.create) {
      for (const subType of objectType.objectSubTypes) {
        try {
          childContext.objectSubType.value = subType;
          await this.objectNodeService.checkBrothersCondition(
            entity.id as string,
            childContext,
          );
          objectNode.entityCtx.actions.creations[
            subType.subObjectTypeId
          ] = this.getObjectNodeDefinition(
            await this.objectTypeService.searchById(subType.subObjectTypeId),
          );

          // eslint-disable-next-line no-empty
        } catch (error) {}
      }
    }
    const children = await childContext.brothers.getOrSetValue(async () =>
      this.objectNodeService.searchByParentId(entity.id as string),
    );
    objectNode.entityCtx.actions.reads = [];
    for (const child of children) {
      if (
        -1 === objectNode.entityCtx.actions.reads.indexOf(child.objectTypeId)
      ) {
        objectNode.entityCtx.actions.reads.push(child.objectTypeId);
      }
    }
    for (const childCreationObjectTypeId of Object.keys(
      objectNode.entityCtx.actions.creations,
    )) {
      if (
        -1 ===
        objectNode.entityCtx.actions.reads.indexOf(childCreationObjectTypeId)
      ) {
        objectNode.entityCtx.actions.reads.push(childCreationObjectTypeId);
      }
    }
  }

  protected getObjectNodeDefinition(objectType: ObjectType) {
    return merge(
      {},
      OBJECT_NODE_SCHEMA,
      objectType.definition,
      OBJECT_NODE_SCHEMA,
      objectType.contentDefinition,
    );
  }
}
