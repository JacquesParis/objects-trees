import {IJsonSchema, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {merge, some} from 'lodash';
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

interface OneOfTreeOption {
  namespaceName?: string;
  namespaceType?: string;
  ownerName?: string;
  ownerType?: string;
  treeType: string;
}

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
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    // _.merge({}, this.entityDefinition, objectType.definition, this.entityDefinition, objectType.contentDefinition),
    const objectType = await ctx.nodeContext.objectType.getOrSetValue(
      async () => {
        return this.objectTypeService.searchById(objectNode.objectTypeId);
      },
    );
    objectNode.entityCtx.jsonSchema = await this.getObjectNodeDefinition(
      objectType,
      ctx.nodeContext,
    );
    objectNode.entityCtx.implementedTypes =
      objectType.entityCtx?.implementedTypes;
  }

  public async getObjectNodeDefinition(
    objectType: ObjectType,
    ctx: NodeContext,
  ): Promise<IJsonSchema> {
    const schema = merge(
      {},
      OBJECT_NODE_SCHEMA,
      objectType.definition,
      OBJECT_NODE_SCHEMA,
      objectType.contentDefinition,
    );

    if (schema?.properties) {
      for (const key of Object.keys(schema.properties)) {
        for (const option of Object.keys(schema.properties[key])) {
          switch (option) {
            case 'oneOfTree':
              schema.properties[key].oneOf = await this.oneOfTree(
                schema.properties[key].oneOfTree,
                ctx,
              );
              delete schema.properties[key].oneOfTree;
              if (
                !schema.properties[key].oneOf ||
                0 === schema.properties[key].oneOf.length
              ) {
                delete schema.properties[key].oneOf;
              }
              break;
          }
        }
      }
    }

    return schema;
  }

  async oneOfTree(
    oneOfTreeOptions: OneOfTreeOption[],
    ctx: NodeContext,
  ): Promise<{enum: string[]; title: string}[]> {
    const result = [];
    const objectNode: ObjectNode | undefined = ctx.node.value
      ? ctx.node.value
      : ctx.parent.value
      ? ctx.parent.value
      : undefined;
    for (const oneOfTreeOption of oneOfTreeOptions) {
      try {
        let owner: ObjectNode | undefined = undefined;
        if (oneOfTreeOption.ownerType && oneOfTreeOption.ownerName) {
          owner = await this.objectNodeService.searchOwner(
            oneOfTreeOption.ownerType,
            oneOfTreeOption.ownerName,
          );
        } else if (objectNode) {
          owner = await ctx.owner.getOrSetValue(async () =>
            this.objectNodeService.searchById(objectNode.parentOwnerId),
          );
        }
        if (!owner) {
          continue;
        }
        let namespace: ObjectNode | undefined = undefined;
        if (oneOfTreeOption.namespaceType && oneOfTreeOption.namespaceName) {
          namespace = await this.objectNodeService.searchNamespaceOfOwnerId(
            owner.id as string,
            oneOfTreeOption.namespaceType,
            oneOfTreeOption.namespaceName,
          );
        } else if (
          objectNode &&
          !(oneOfTreeOption.ownerType && oneOfTreeOption.ownerName)
        ) {
          namespace = await ctx.namespace.getOrSetValue(async () =>
            this.objectNodeService.searchById(objectNode.parentNamespaceId),
          );
        }
        if (!namespace) {
          continue;
        }
        const trees = await this.objectNodeService.searchTreesOfNamespaceId(
          namespace.id as string,
          oneOfTreeOption.treeType,
        );
        for (const tree of trees) {
          const treeId =
            'tree/' +
            owner.objectTypeId +
            '/' +
            owner.name +
            '/' +
            namespace.objectTypeId +
            '/' +
            namespace.name +
            '/' +
            oneOfTreeOption.treeType +
            '/' +
            tree.name;

          if (!some(result, (choice) => choice.enum[0] === treeId)) {
            result.push({
              enum: [treeId],
              title: owner.name + ' - ' + namespace.name + ' - ' + tree.name,
            });
          }
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
    return result;
    /*[
      {
        enum: [
          'Repository/public/Category/templates/TravelStoryTemplate/travelStory',
        ],
        title: 'public - templates - travelStory',
      },
    ];*/
  }
}