import {IJsonSchema, IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {merge, some} from 'lodash';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {
  CurrentContext,
  ExpectedValue,
  NodeContext,
} from './../application.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {ObjectTypeService} from './../object-type.service';
import {ENTITY_DEFINITION_PROVIDER} from './entity-definition.cont';
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
      description: 'Only alphanumeric characters, -, _ or . are allowed.',
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
interface OneOfNodeOption {
  namespaceName?: string;
  namespaceType?: string;
  ownerName?: string;
  ownerType?: string;
  treeType?: string;
  treeName?: string;
  nodeType: string;
}

export class ObjectNodeDefinitionService implements EntityDefinitionInterface {
  public providerId: string = ENTITY_DEFINITION_PROVIDER;
  public serviceId: string = ObjectNodeDefinitionService.name;
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

    await this.completeProperties(schema?.properties, ctx);

    return schema;
  }

  public async completeProperties(
    properties: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [name: string]: any;
    },
    ctx: NodeContext,
  ) {
    if (properties) {
      for (const key of Object.keys(properties)) {
        for (const option of Object.keys(properties[key])) {
          switch (option) {
            case 'oneOfNode':
              properties[key].oneOf = await this.oneOfNode(
                properties[key].oneOfNode,
                ctx,
              );
              delete properties[key].oneOfNode;
              if (
                !properties[key].oneOf ||
                0 === properties[key].oneOf.length
              ) {
                delete properties[key].oneOf;
              }
              break;
            case 'oneOfTree':
              properties[key].oneOf = await this.oneOfTree(
                properties[key].oneOfTree,
                ctx,
              );
              delete properties[key].oneOfTree;
              if (
                !properties[key].oneOf ||
                0 === properties[key].oneOf.length
              ) {
                delete properties[key].oneOf;
              }
              break;
            case 'type':
              switch (properties[key].type) {
                case 'object':
                  await this.completeProperties(
                    properties[key].properties,
                    ctx,
                  );
                  break;
                case 'array':
                  await this.completeProperties(
                    {items: properties[key].items},
                    ctx,
                  );
                  break;
              }
              break;
          }
        }
      }
    }
  }

  protected async oneOfTree(
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
            encodeURIComponent(
              oneOfTreeOption.ownerType
                ? oneOfTreeOption.ownerType
                : owner.objectTypeId,
            ) +
            '/' +
            encodeURIComponent(
              oneOfTreeOption.ownerName
                ? oneOfTreeOption.ownerName
                : owner.name,
            ) +
            '/' +
            encodeURIComponent(
              oneOfTreeOption.namespaceType
                ? oneOfTreeOption.namespaceType
                : namespace.objectTypeId,
            ) +
            '/' +
            encodeURIComponent(
              oneOfTreeOption.namespaceName
                ? oneOfTreeOption.namespaceName
                : namespace.name,
            ) +
            '/' +
            encodeURIComponent(oneOfTreeOption.treeType) +
            '/' +
            encodeURIComponent(tree.name);

          if (!some(result, (choice) => choice.enum[0] === treeId)) {
            ctx.references[treeId] = new ExpectedValue(tree);
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
  }

  protected async oneOfNode(
    oneOfNodeOptions: OneOfNodeOption[],
    ctx: NodeContext,
  ): Promise<{enum: string[]; title: string}[]> {
    const result = [];
    const objectNode: ObjectNode | undefined = ctx.node.value
      ? ctx.node.value
      : ctx.parent.value
      ? ctx.parent.value
      : undefined;
    for (const oneOfNodeOption of oneOfNodeOptions) {
      try {
        let owner: ObjectNode | undefined = undefined;
        if (oneOfNodeOption.ownerType && oneOfNodeOption.ownerName) {
          owner = await this.objectNodeService.searchOwner(
            oneOfNodeOption.ownerType,
            oneOfNodeOption.ownerName,
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
        if (oneOfNodeOption.namespaceType && oneOfNodeOption.namespaceName) {
          namespace = await this.objectNodeService.searchNamespaceOfOwnerId(
            owner.id as string,
            oneOfNodeOption.namespaceType,
            oneOfNodeOption.namespaceName,
          );
        } else if (
          objectNode &&
          !(oneOfNodeOption.ownerType && oneOfNodeOption.ownerName)
        ) {
          namespace = await ctx.namespace.getOrSetValue(async () =>
            this.objectNodeService.searchById(objectNode.parentNamespaceId),
          );
        }
        if (!namespace) {
          continue;
        }
        let tree: ObjectNode | undefined = undefined;
        if (oneOfNodeOption.treeType && oneOfNodeOption.treeName) {
          tree = await this.objectNodeService.searchTreeOfNamespaceId(
            namespace.id as string,
            oneOfNodeOption.treeType,
            oneOfNodeOption.treeName,
          );
        } else if (
          objectNode &&
          !(
            oneOfNodeOption.ownerType &&
            oneOfNodeOption.ownerName &&
            oneOfNodeOption.namespaceType &&
            oneOfNodeOption.namespaceName
          )
        ) {
          tree = await ctx.namespace.getOrSetValue(async () =>
            this.objectNodeService.searchById(objectNode.parentTreeId),
          );
        }
        if (!tree) {
          continue;
        }
        const nodes = await this.objectNodeService.searchByTreeId(
          tree.id as string,
          {
            objectTypeIds: await this.objectTypeService.getImplementingTypes(
              oneOfNodeOption.nodeType,
            ),
          },
        );
        for (const node of nodes) {
          const nodeId =
            'node/' +
            encodeURIComponent(
              oneOfNodeOption.ownerType
                ? oneOfNodeOption.ownerType
                : owner.objectTypeId,
            ) +
            '/' +
            encodeURIComponent(
              oneOfNodeOption.ownerName
                ? oneOfNodeOption.ownerName
                : owner.name,
            ) +
            '/' +
            encodeURIComponent(
              oneOfNodeOption.namespaceType
                ? oneOfNodeOption.namespaceType
                : namespace.objectTypeId,
            ) +
            '/' +
            encodeURIComponent(
              oneOfNodeOption.namespaceName
                ? oneOfNodeOption.namespaceName
                : namespace.name,
            ) +
            '/' +
            encodeURIComponent(
              oneOfNodeOption.treeType
                ? oneOfNodeOption.treeType
                : tree.objectTypeId,
            ) +
            '/' +
            encodeURIComponent(
              oneOfNodeOption.treeName ? oneOfNodeOption.treeName : tree.name,
            ) +
            '/' +
            encodeURIComponent(oneOfNodeOption.nodeType) +
            '/' +
            encodeURIComponent(node.name);

          if (!some(result, (choice) => choice.enum[0] === nodeId)) {
            ctx.references[nodeId] = new ExpectedValue(node);
            result.push({
              enum: [nodeId],
              title:
                owner.name +
                ' - ' +
                namespace.name +
                ' - ' +
                tree.name +
                ' - ' +
                node.name,
            });
          }
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }
    return result;
  }
}
