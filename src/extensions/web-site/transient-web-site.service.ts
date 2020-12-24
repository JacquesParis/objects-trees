import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {find, indexOf, merge} from 'lodash';
import {doesTreeImplementOneOfType} from '../../helper';
import {EntityName} from '../../models';
import {CurrentContext} from '../../services';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {ObjectNodeDefinitionService} from './../../services/entity-definition/object-node-definition.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {TransientUriReferenceService} from './../../services/inside-rest/transient-uri-reference.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {TransientContentGenericService} from './../content-generic-template/transient-content-generic.service';
import {
  PAGE_WITH_TEMPLATE_CHOICE,
  WEB_SITE_PROVIDER,
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WEB_SITE_WITH_PAGES_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site.const';
import {
  MenuEntry,
  MenuEntryTree,
  MenuTree,
  PageTemplateChoice,
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
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(TransientUriReferenceService)
    private transientUriReferenceService: TransientUriReferenceService,
    @service(TransientContentGenericService)
    private transientContentGenericService: TransientContentGenericService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add welcomePage Id and Uri',
      EntityName.objectTree,
      WEB_SITE_VIEW_TYPE.name,
      this.completeWebSiteView.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add menuEntries, tree of site menu entries',
      EntityName.objectTree,
      WEB_SITE_VIEW_WITH_MENU_TYPE.name,
      this.completeWebSiteViewWithMenu.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Complete menuEntries json schema definition with menuEntries from referenced template',
      EntityName.objectNode,
      WEB_SITE_VIEW_WITH_MENU_TYPE.name,
      this.completeWebSiteViewWithMenuNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Complete pageTemplateChoice json chema definition with pageTemplateChoice from referenced template and add its conditional page template configuration',
      EntityName.objectNode,
      PAGE_WITH_TEMPLATE_CHOICE.name,
      this.completePageTypeNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add new template configuration json schema definitions, configuration from new added referenced templates',
      EntityName.objectNode,
      WEB_SITE_WITH_PAGES_TEMPLATE_TYPE.name,
      this.completeWebSiteWithPagesTemplateNode.bind(this),
    );
  }

  addTemplatesConfigurations(
    objectNode: ObjectNode,
    configurationName: string,
    configurationValue: Object,
  ) {
    if (!objectNode.templatesConfigurations) {
      objectNode.templatesConfigurations = {
        id: objectNode.id + '/templatesConfigurations',
        entityCtx: {
          entityType: EntityName.objectNode,
        },
      };
    }

    objectNode.templatesConfigurations[configurationName] = merge(
      {
        id: objectNode.id + '/templatesConfigurations/' + configurationName,
        entityCtx: {
          entityType: EntityName.objectNode,
        },
      },
      configurationValue,
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
    if (objectNode.entityCtx?.jsonSchema?.properties.pageTemplateChoice) {
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
                enum: [pageTemplateChoice.pageTypeKey],
                title: pageTemplateChoice.pageTypeName,
              });
            }
          }
          if (0 < oneOf.length) {
            objectNode.entityCtx.jsonSchema.properties.pageTemplateChoice.oneOf = oneOf;

            if (objectNode.pageTemplateChoice) {
              const pageTemplateChoice: PageTemplateChoice = find(
                templateTree.pageTemplateChoices,
                (choice: PageTemplateChoice) =>
                  objectNode.pageTemplateChoice === choice.pageTypeKey,
              );
              if (pageTemplateChoice?.pageObjectTreeId) {
                objectNode.pageObjectTreeId =
                  pageTemplateChoice.pageObjectTreeId;
                const pageObjectTreeIdParts: string[] = objectNode.pageObjectTreeId.split(
                  '/',
                );
                const pageObjectTreeName =
                  pageObjectTreeIdParts[pageObjectTreeIdParts.length - 1];
                if (
                  pageTemplateChoice.templatesConfigurations &&
                  pageObjectTreeName in
                    pageTemplateChoice.templatesConfigurations
                ) {
                  this.addTemplatesConfigurations(
                    objectNode,
                    pageObjectTreeName,
                    pageTemplateChoice.templatesConfigurations[
                      pageObjectTreeName
                    ],
                  );
                }
              }
              this.uriCompleteService.addUri(objectNode, ctx);
              await this.transientUriReferenceService.completeReturnedEntity(
                objectNode,
                ctx,
              );
            }
          }
        }
      }
    }
  }

  async completeWebSiteWithPagesTemplateNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    await this.transientContentGenericService.addTemplateConfiguration(
      objectNode.entityCtx?.jsonSchema?.properties?.pageTemplateChoices?.items,
      'pageObjectTreeId',
      'model.pageTemplateChoices[arrayIndex]',
      ctx,
    );
  }
}
