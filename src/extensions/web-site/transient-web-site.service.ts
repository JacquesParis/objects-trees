import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {find, indexOf, isArray, merge} from 'lodash';
import {doesTreeImplementOneOfType} from '../../helper';
import {EntityName} from '../../models';
import {CurrentContext} from '../../services';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {ObjectNodeDefinitionService} from './../../services/entity-definition/object-node-definition.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {
  PAGE_WITH_TEMPLATE_CHOICE,
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_PAGES_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site.const';
import {
  MenuEntry,
  MenuEntryTree,
  MenuTree,
  WebSiteView,
  WebSiteViewWithMenuTree,
  WebSiteWitHMenuTemplate,
} from './web-site.interface';

export class TransientWebSiteService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectNodeDefinitionService)
    private objectNodeDefinitionService: ObjectNodeDefinitionService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      EntityName.objectTree,
      WEB_SITE_VIEW_TYPE.name,
      this.completeWebSiteView.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      EntityName.objectTree,
      WEB_SITE_VIEW_WITH_MENU_TYPE.name,
      this.completeWebSiteViewWithMenu.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      EntityName.objectNode,
      WEB_SITE_VIEW_WITH_MENU_TYPE.name,
      this.completeWebSiteViewWithMenuNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      EntityName.objectNode,
      PAGE_WITH_TEMPLATE_CHOICE.name,
      this.completePageTypeNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      EntityName.objectNode,
      WEB_SITE_WITH_PAGES_TEMPLATE_TYPE.name,
      this.completeWebSiteWithPagesTemplateNode.bind(this),
    );
  }

  async completeWebSiteView(
    webSiteWiewTree: ObjectNodeTree<WebSiteView>,
    ctx: CurrentContext,
  ): Promise<void> {
    const welcomePage: ObjectTree | undefined = find(
      webSiteWiewTree.children,
      (child) =>
        -1 < indexOf(child.entityCtx?.implementedTypes, WELCOME_PAGE_TYPE.name),
    );
    if (welcomePage) {
      webSiteWiewTree.welcomePageId = welcomePage.id;
      webSiteWiewTree.welcomePageUri = welcomePage.uri;
    }
  }

  async completeWebSiteViewWithMenu(
    webSiteViewWithMenuTree: WebSiteViewWithMenuTree,
    ctx: CurrentContext,
  ) {
    webSiteViewWithMenuTree.menuEntries = {
      entityCtx: webSiteViewWithMenuTree.treeNode.entityCtx,
      uri: webSiteViewWithMenuTree.treeNode.uri + '/menuEntries',
      id: webSiteViewWithMenuTree.treeNode.id + '/menuEntries',
    };

    const webSiteObjectTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
      webSiteViewWithMenuTree.treeNode.webSiteObjectTreeUri,
      ctx,
    )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;

    if (webSiteViewWithMenuTree.treeNode.menuEntries) {
      for (const menuEntry of webSiteObjectTree.treeNode.menuEntries) {
        if (webSiteViewWithMenuTree.treeNode.menuEntries[menuEntry.entryKey]) {
          const children: MenuTree[] = this.lookForMenuEntries(
            webSiteViewWithMenuTree.children,
            menuEntry.entryTypes,
            webSiteViewWithMenuTree,
            menuEntry.entryKey,
            menuEntry.menuEntryLabelKey ? menuEntry.menuEntryLabelKey : 'name',
          );
          webSiteViewWithMenuTree.menuEntries[menuEntry.entryKey] = ({
            entityCtx: webSiteViewWithMenuTree.entityCtx,
            treeNode: webSiteViewWithMenuTree.treeNode,
            id:
              webSiteViewWithMenuTree.id + '/menuEntries/' + menuEntry.entryKey,
            uri:
              webSiteViewWithMenuTree.uri +
              '/menuEntries/' +
              menuEntry.entryKey,
            aliasUri: undefined,
            children: children,
            disabled: 0 === children.length,
            singleMenu:
              0 === children.length ||
              (1 === children.length && children[0].singleMenu),
          } as unknown) as MenuEntryTree;
          if (
            webSiteViewWithMenuTree.menuEntries[menuEntry.entryKey]
              .singleMenu &&
            !webSiteViewWithMenuTree.menuEntries[menuEntry.entryKey].disabled
          ) {
            webSiteViewWithMenuTree.menuEntries[menuEntry.entryKey].pageTreeId =
              children[0].pageTreeId;
            webSiteViewWithMenuTree.menuEntries[
              menuEntry.entryKey
            ].pageTreeUri = children[0].pageTreeUri;
          }
        }
      }
    }
  }

  protected lookForMenuEntries(
    trees: ObjectTree[],
    entryTypes: string[],
    webSiteViewWithMenuTree: WebSiteViewWithMenuTree,
    entryKey: string,
    menuEntryLabelKey: string,
  ): MenuTree[] {
    const parentMenuTrees: MenuTree[] = [];
    for (const tree of trees) {
      if (
        !!tree.treeNode[menuEntryLabelKey] &&
        doesTreeImplementOneOfType(tree, entryTypes)
      ) {
        const children = this.lookForMenuEntries(
          tree.children,
          entryTypes,
          webSiteViewWithMenuTree,
          entryKey,
          menuEntryLabelKey,
        );
        parentMenuTrees.push({
          entityCtx: tree.entityCtx,
          pageTreeId: tree.id,
          pageTreeUri: tree.uri,
          id:
            webSiteViewWithMenuTree.id +
            '/menuEntries/' +
            entryKey +
            '/' +
            tree.id,
          uri:
            webSiteViewWithMenuTree.uri +
            '/menuEntries/' +
            entryKey +
            '/' +
            tree.id,
          treeNode: tree.treeNode as MenuEntry,
          children: children,
          singleMenu: 0 === children.length,
          menuTitle: tree.treeNode[menuEntryLabelKey],
        } as MenuTree);
      }
    }
    return parentMenuTrees;
  }

  async completeWebSiteViewWithMenuNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    const menuEntriesProperty: IJsonSchema =
      objectNode.entityCtx?.jsonSchema?.properties?.menuEntries;
    const templateMenuEntries: {
      entryKey: string;
      entryName: string;
      entryTypes: string[];
    }[] = objectNode.webSiteObjectTree?.treeNode?.menuEntries;
    if (menuEntriesProperty && templateMenuEntries) {
      for (const menuEntry of templateMenuEntries) {
        menuEntriesProperty.properties[menuEntry.entryKey] = {
          type: 'string',
          title: menuEntry.entryName,
        };
      }
    }
  }

  async completePageTypeNode(objectNode: ObjectNode, ctx: CurrentContext) {
    if (objectNode.entityCtx?.jsonSchema?.properties.pageObjectTreeId) {
      const treeNode: ObjectNode = await this.objectNodeService.getTreeNode(
        objectNode,
        ctx,
      );
      if (treeNode.webSiteObjectTreeId) {
        const templatePath = treeNode.webSiteObjectTreeId.split('/');
        const templateTree = await this.objectNodeService.searchTreeNode(
          templatePath[1],
          templatePath[2],
          templatePath[3],
          templatePath[4],
          templatePath[5],
          templatePath[6],
        );

        if (templateTree?.pageTemplateChoices) {
          const oneOf: {enum: {[0]: string}; title: string}[] = [];
          for (const pageTemplateChoice of templateTree.pageTemplateChoices) {
            if (
              doesTreeImplementOneOfType(
                objectNode,
                pageTemplateChoice.pageTypes,
              )
            ) {
              oneOf.push({
                enum: [pageTemplateChoice.pageObjectTreeId],
                title: pageTemplateChoice.pageTypeName,
              });
            }
          }
          if (0 < oneOf.length) {
            objectNode.entityCtx.jsonSchema.properties.pageObjectTreeId.oneOf = oneOf;
          }
        }
      }
    }
  }

  async completeWebSiteWithPagesTemplateNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    console.log('complete', objectNode, ctx);
    if (
      isArray(
        objectNode.entityCtx?.jsonSchema?.properties?.pageTemplateChoices?.items
          ?.properties?.pageObjectTreeId?.oneOf,
      ) &&
      0 <
        objectNode.entityCtx?.jsonSchema?.properties.pageTemplateChoices.items
          .properties.pageObjectTreeId.oneOf.length
    ) {
      const pageRefJasonSchema: IJsonSchema = objectNode.entityCtx?.jsonSchema
        ?.properties.pageTemplateChoices.items as IJsonSchema;
      for (const pageTemplateEnum of pageRefJasonSchema.properties
        .pageObjectTreeId.oneOf) {
        const pageTemplateTreeId = pageTemplateEnum.enum[0];
        const pageTemplate =
          ctx.nodeContext.references[pageTemplateTreeId]?.value;
        if (pageTemplate) {
          if (!pageTemplate.contentGenericTemplate) {
            pageTemplate.contentGenericTemplate = {};
            await this.transientEntityService.completeReturnedEntity(
              EntityName.objectNode,
              pageTemplate,
              CurrentContext.get({
                nodeContext: {
                  node: ctx.nodeContext.references[pageTemplateTreeId],
                },
              }),
            );
          }
          if (
            pageTemplate?.contentGenericTemplate?.refererConfig?.properties &&
            0 <
              Object.keys(
                pageTemplate?.contentGenericTemplate?.refererConfig?.properties,
              ).length
          ) {
            if (!pageRefJasonSchema.properties.templatesConfigurations) {
              pageRefJasonSchema.properties.templatesConfigurations = {
                type: 'object',
                title: 'Page template configurattion',
                'x-schema-form': {labelHtmlClass: 'd-none'},
                properties: {},
              };
            }
            pageRefJasonSchema.properties.templatesConfigurations.properties[
              pageTemplate.name
            ] = merge(
              {
                type: 'object',
                'x-schema-form': {labelHtmlClass: 'd-none'},
              },
              pageTemplate.contentGenericTemplate.refererConfig,
            );
            this.addCondition(
              "model.pageTemplateChoices[arrayIndex].pageObjectTreeId=='" +
                pageTemplateTreeId +
                "'",
              pageRefJasonSchema.properties.templatesConfigurations.properties[
                pageTemplate.name
              ],
            );
          }
        }
      }
      if (pageRefJasonSchema?.properties?.templatesConfigurations?.properties) {
        await this.objectNodeDefinitionService.completeProperties(
          pageRefJasonSchema.properties.templatesConfigurations.properties,
          ctx.nodeContext,
        );
      }
    }
  }

  protected addCondition(condition: string, schema: IJsonSchema) {
    if (!schema['x-schema-form']) {
      schema['x-schema-form'] = {};
    }
    schema['x-schema-form'].condition = condition;
    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        this.addCondition(condition, schema.properties[key]);
      }
    }
  }
}
