import {IJsonSchema, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {merge} from 'lodash';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {CurrentContext} from './../application.service';
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
    description: {
      type: 'string',
      // tslint:disable-next-line: object-literal-sort-keys
      title: 'Description',
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
  }

  public getObjectNodeDefinition(objectType: ObjectType) {
    return merge(
      {},
      OBJECT_NODE_SCHEMA,
      objectType.definition,
      OBJECT_NODE_SCHEMA,
      objectType.contentDefinition,
    );
  }
}
