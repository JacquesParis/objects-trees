import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {ObjectTree} from '../../models/object-tree.model';
import {CurrentContext} from '../application.service';
import {ObjectTypeService} from '../object-type.service';
import {ObjectType} from './../../models/object-type.model';
import {NodeContext} from './../application.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {ENTITY_DEFINITION_PROVIDER} from './entity-definition.cont';
import {
  EntityDefinitionInterface,
  EntityDefinitionService,
} from './entity-definition.service';
import {MustacheService} from './mustache.service';
import {ObjectNodeDefinitionService} from './object-node-definition.service';

export class ObjectTreeDefinitionService implements EntityDefinitionInterface {
  public providerId: string = ENTITY_DEFINITION_PROVIDER;
  public serviceId: string = ObjectTreeDefinitionService.name;
  constructor(
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ObjectNodeDefinitionService)
    protected objectNodeDefinitionService: ObjectNodeDefinitionService,
    @service(EntityDefinitionService)
    protected entityDefinitionService: EntityDefinitionService,
    @service(MustacheService) protected mustacheService: MustacheService,
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
      objectTree.entityCtx = {
        entityType: EntityName.objectTree,
      };
    }
    if (!objectTree.entityCtx.preview) {
      objectTree.entityCtx.preview = {
        icon: '',
        html: `<span class="child-tree-preview">
        {{#dataNode.menuTitle}}{{dataNode.menuTitle}}{{/dataNode.menuTitle}}
        {{^dataNode.menuTitle}}
          {{#dataNode.pageTitle}}{{dataNode.pageTitle}}{{/dataNode.pageTitle}}
          {{^dataNode.pageTitle}}
            {{#dataNode.paragraphTitle}}{{dataNode.paragraphTitle}}{{/dataNode.paragraphTitle}}
            {{^dataNode.paragraphTitle}}
              {{dataNode.name}}
            {{/dataNode.paragraphTitle}}
          {{/dataNode.pageTitle}}
        {{/dataNode.menuTitle}}</span>`,
      };
    }
    // _.merge({}, this.entityDefinition, objectType.definition, this.entityDefinition, objectType.contentDefinition),

    const treeType = await ctx.treeContext.treeType.getOrSetValue(async () => {
      return this.objectTypeService.searchById(
        objectTree.treeNode.objectTypeId,
      );
    });
    if (
      objectTree.entityCtx.preview &&
      treeType.iconView &&
      '' !== treeType.iconView
    ) {
      objectTree.entityCtx.preview.icon = treeType.iconView;
    }
    if (treeType.templateView && '' !== treeType.templateView) {
      objectTree.entityCtx.preview.html = treeType.templateView;
    }
    objectTree.entityCtx.preview.html = this.mustacheService.parse(
      objectTree.entityCtx.preview.html as string,
      {
        dataTree: objectTree,
        dataNode: objectTree.treeNode,
      },
    );
    objectTree.entityCtx.implementedTypes =
      treeType.entityCtx?.implementedTypes;
    if (!objectTree.entityCtx.actions) {
      objectTree.entityCtx.actions = {};
    }
    if (!objectTree.entityCtx.actions.creations) {
      objectTree.entityCtx.actions.creations = {};
    }
    const childContext = new NodeContext();
    childContext.brothers.value = ctx.treeContext.treeChildren.value;
    childContext.parent.value = objectTree.treeNode;
    childContext.parentType.value = treeType;
    if (
      treeType.objectSubTypes &&
      objectTree.entityCtx?.aclCtx?.rights?.create
    ) {
      for (const subType of treeType.objectSubTypes) {
        if (
          objectTree.childrenEntityCtx &&
          subType.subObjectTypeId in objectTree.childrenEntityCtx &&
          'create' in
            objectTree.childrenEntityCtx[subType.subObjectTypeId].aclCtx
              .rights &&
          !objectTree.childrenEntityCtx[subType.subObjectTypeId].aclCtx.rights
            .create
        ) {
          continue;
        }
        try {
          childContext.objectSubType.value = subType;
          await this.objectNodeService.checkBrothersCondition(
            entity.id as string,
            childContext,
          );
          objectTree.entityCtx.actions.creations[subType.subObjectTypeId] = {
            schema: await this.objectNodeDefinitionService.getObjectNodeDefinition(
              await this.objectTypeService.searchById(subType.subObjectTypeId),
              childContext,
            ),
          };
          const objectType: ObjectType = await this.objectTypeService.searchById(
            subType.subObjectTypeId,
          );
          if (objectType.iconView) {
            objectTree.entityCtx.actions.creations[
              subType.subObjectTypeId
            ].icon = objectType.iconView;
          }

          // eslint-disable-next-line no-empty
        } catch (error) {}
      }
    }

    objectTree.entityCtx.actions.reads = [];

    const knownSubObjectTypeIds: string[] = treeType.objectSubTypes
      ? treeType.objectSubTypes.map((subType) => subType.subObjectTypeId)
      : [];
    for (let index = knownSubObjectTypeIds.length - 1; index >= 0; index--) {
      if (
        objectTree.childrenEntityCtx &&
        knownSubObjectTypeIds[index] in objectTree.childrenEntityCtx &&
        'read' in
          objectTree.childrenEntityCtx[knownSubObjectTypeIds[index]].aclCtx
            .rights &&
        !objectTree.childrenEntityCtx[knownSubObjectTypeIds[index]].aclCtx
          .rights.read
      ) {
        knownSubObjectTypeIds.splice(index, 1);
      }
    }
    if (objectTree.children) {
      for (
        let childIndex = objectTree.children.length - 1;
        childIndex >= 0;
        childIndex--
      ) {
        const child = objectTree.children[childIndex];
        if (
          -1 ===
            objectTree.entityCtx.actions.reads.indexOf(
              child.treeNode.objectTypeId,
            ) &&
          -1 < knownSubObjectTypeIds.indexOf(child.treeNode.objectTypeId)
        ) {
          objectTree.entityCtx.actions.reads.push(child.treeNode.objectTypeId);
        } else if (
          -1 === knownSubObjectTypeIds.indexOf(child.treeNode.objectTypeId)
        ) {
          objectTree.children.splice(childIndex, 1);
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

    for (const child of objectTree.children) {
      if (!child.treeNode.tree) {
        await this.entityDefinitionService.completeReturnedEntity(
          EntityName.objectTree,
          child,
          new CurrentContext(),
        );
      }
    }
  }
}
