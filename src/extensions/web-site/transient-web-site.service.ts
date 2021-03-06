/* eslint-disable no-empty */
import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {find, indexOf, intersection, isObject} from 'lodash';
import {EntityName} from '../../models';
import {CurrentContext, ObjectTypeService} from '../../services';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {TransientUriReferenceService} from './../../services/inside-rest/transient-uri-reference.service';
import {ObjectNodeService} from './../../services/object-node/object-node.service';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {TransientContentGenericService} from './../content-generic-template/transient-content-generic.service';
import {
  PAGE_TYPE,
  PAGE_WITH_PARAGRAPH_TYPE,
  PAGE_WITH_SUB_PAGE_TYPE,
  PAGE_WITH_TEMPLATE_CHOICE,
  PARAGRAPH_CONTAINER_TYPE,
  PARAGRAPH_TYPE,
  PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE,
  WEB_SITE_MENU_ENTRIES_TYPE,
  WEB_SITE_PROVIDER,
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_WITH_PAGES_TEMPLATE_TYPE,
  WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site.const';
import {
  MenuEntry,
  MenuEntryTree,
  MenuTree,
  PageTemplateChoice,
  ParagraphTemplateChoice,
  WebSiteMenuEntries,
  WebSiteMenuEntriesTree,
  WebSiteView,
  WebSiteWitHMenuTemplate,
} from './web-site.interface';

export class TransientWebSiteService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(TransientUriReferenceService)
    private transientUriReferenceService: TransientUriReferenceService,
    @service(TransientContentGenericService)
    private transientContentGenericService: TransientContentGenericService,
    @service(ObjectTreeService)
    private objectTreeService: ObjectTreeService,
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
      'Complete menuEntries json schema definition with menuEntries from referenced template',
      EntityName.objectNode,
      WEB_SITE_MENU_ENTRIES_TYPE.name,
      this.completeWebSiteMenuEntriesNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add menuEntriesList, tree of site menu entries',
      EntityName.objectNode,
      WEB_SITE_MENU_ENTRIES_TYPE.name,
      this.completeWebSiteMenuEntriesNode2.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Complete pageTemplateChoice json schema definition with pageTemplateChoice from referenced template and add its conditional page template configuration',
      EntityName.objectNode,
      PAGE_WITH_TEMPLATE_CHOICE.name,
      this.completePageWithTemplateChoiceNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Complete paragraphsTemplateChoice json schema definition with paragraphsTemplateChoice from referenced template and add its conditional paragraph template configuration',
      EntityName.objectNode,
      PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name,
      this.completeParagraphWithTemplateChoiceNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add new page template configuration json schema definitions, configuration from new added referenced templates',
      EntityName.objectNode,
      WEB_SITE_WITH_PAGES_TEMPLATE_TYPE.name,
      this.completeWebSiteWithPagesTemplateNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add new paragraph template configuration json schema definitions, configuration from new added referenced templates',
      EntityName.objectNode,
      WEB_SITE_WITH_PARAGRAPHS_TEMPLATE_TYPE.name,
      this.completeWebSiteWithParagraphsTemplateNode.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectNode>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add pageNodes field, list of sub-pages',
      EntityName.objectNode,
      PAGE_WITH_SUB_PAGE_TYPE.name,
      this.completePageWithSubPageNode.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectNode>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add pageId and siteId',
      EntityName.objectNode,
      PAGE_TYPE.name,
      this.completePageNode.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectNode>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add paragraphNodes field, list of paragraphs',
      EntityName.objectNode,
      PAGE_WITH_PARAGRAPH_TYPE.name,
      this.completePageWithParagraphNode.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectNode>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add paragraphNodes field, list of paragraphs',
      EntityName.objectNode,
      PARAGRAPH_CONTAINER_TYPE.name,
      this.completeParagraphContainerNode.bind(this),
    );
  }
  addTemplatesConfigurationsReferences(objectNode: ObjectNode) {
    if (objectNode.templatesConfigurations) {
      if (!objectNode.templatesConfigurations.id) {
        objectNode.templatesConfigurations.id =
          objectNode.id + '/templatesConfigurations';
      }
      if (!objectNode.templatesConfigurations.entityCtx) {
        objectNode.templatesConfigurations.entityCtx = {
          entityType: EntityName.objectNode,
        };
      }
      for (const configurationName of Object.keys(
        objectNode.templatesConfigurations,
      )) {
        if (isObject(objectNode.templatesConfigurations[configurationName])) {
          if (!objectNode.templatesConfigurations[configurationName].id) {
            objectNode.templatesConfigurations[configurationName].id =
              objectNode.id + '/templatesConfigurations/' + configurationName;
          }

          if (
            !objectNode.templatesConfigurations[configurationName].entityCtx
          ) {
            objectNode.templatesConfigurations[configurationName].entityCtx = {
              entityType: EntityName.objectNode,
            };
          }
        }
      }
    }
  }

  addTemplatesConfigurations(
    objectNode: ObjectNode,
    configurationName: string,
    configurationValue: Object,
  ) {
    if (!objectNode.templatesConfigurations) {
      objectNode.templatesConfigurations = {};
    }

    objectNode.templatesConfigurations[configurationName] = configurationValue;
    this.addTemplatesConfigurationsReferences(objectNode);
  }

  async completeWebSiteView(
    webSiteViewTree: ObjectNodeTree<WebSiteView>,
    ctx: CurrentContext,
  ): Promise<void> {
    const welcomePages: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(
        webSiteViewTree,
      )
    )[WELCOME_PAGE_TYPE.name];
    if (welcomePages && 0 < welcomePages.length) {
      webSiteViewTree.welcomePageId = welcomePages[0].id;
      webSiteViewTree.welcomePageUri = welcomePages[0].uri;
    }
  }

  async completeWebSiteMenuEntriesNode2(
    webSiteMenuEntriesNode: WebSiteMenuEntries,
    ctx: CurrentContext,
  ) {
    webSiteMenuEntriesNode.menuEntriesList = {
      entityCtx: webSiteMenuEntriesNode.entityCtx,
      uri: webSiteMenuEntriesNode.uri + '/menuEntries',
      id: webSiteMenuEntriesNode.id + '/menuEntries',
    };

    try {
      const webSiteTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
        webSiteMenuEntriesNode.webSiteObjectTreeUri,
        ctx,
      )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;
      const webSiteMenuEntriesTree: WebSiteMenuEntriesTree<WebSiteMenuEntries> = (await this.insideRestService.read(
        this.uriCompleteService.getUri(
          EntityName.objectTree,
          webSiteMenuEntriesNode.id as string,
          ctx,
        ),
        ctx,
      )) as WebSiteMenuEntriesTree<WebSiteMenuEntries>;

      if (webSiteMenuEntriesNode.menuEntries) {
        for (const menuEntry of webSiteTree.treeNode.menuEntries) {
          if (webSiteMenuEntriesNode.menuEntries[menuEntry.entryKey]) {
            const children: MenuTree[] = await this.lookForMenuEntries(
              [webSiteMenuEntriesTree],
              menuEntry.entryTypes,
              webSiteMenuEntriesTree,
              menuEntry.entryKey,
              menuEntry.menuEntryLabelKey
                ? menuEntry.menuEntryLabelKey
                : 'name',
              !!menuEntry.adminEntry,
            );
            webSiteMenuEntriesNode.menuEntriesList[menuEntry.entryKey] = ({
              entityCtx: webSiteMenuEntriesTree.entityCtx,
              treeNode: {
                menuTitle: webSiteMenuEntriesNode.menuTitle,
                name: webSiteMenuEntriesNode.name,
              },
              id:
                webSiteMenuEntriesTree.id +
                '/menuEntries/' +
                menuEntry.entryKey,
              uri:
                webSiteMenuEntriesTree.uri +
                '/menuEntries/' +
                menuEntry.entryKey,
              aliasUri: undefined,
              children: children,
              disabled: 0 === children.length,
              singleMenu:
                0 === children.length ||
                (1 === children.length && children[0].singleMenu),
              adminEntry: !!menuEntry.adminEntry,
            } as unknown) as MenuEntryTree;
            if (
              webSiteMenuEntriesNode.menuEntriesList[menuEntry.entryKey]
                .singleMenu &&
              !webSiteMenuEntriesNode.menuEntriesList[menuEntry.entryKey]
                .disabled
            ) {
              webSiteMenuEntriesNode.menuEntriesList[
                menuEntry.entryKey
              ].pageTreeId = children[0].pageTreeId;
              webSiteMenuEntriesNode.menuEntriesList[
                menuEntry.entryKey
              ].pageTreeUri = children[0].pageTreeUri;
            }
          }
        }
      }
    } catch (error) {}
  }

  public async lookForMenuEntries(
    trees: ObjectTree[],
    entryTypes: string[],
    webSiteMenuEntriesTree: WebSiteMenuEntriesTree<WebSiteMenuEntries>,
    entryKey: string,
    menuEntryLabelKey: string,
    adminEntry: boolean,
  ): Promise<MenuTree[]> {
    const parentMenuTrees: MenuTree[] = [];
    for (const tree of trees) {
      if (
        !!tree.treeNode[menuEntryLabelKey] &&
        intersection(
          await this.objectTypeService.getImplementedTypes(
            tree.treeNode.objectTypeId,
          ),
          entryTypes,
        ).length > 0
      ) {
        const children = await this.lookForMenuEntries(
          tree.children,
          entryTypes,
          webSiteMenuEntriesTree,
          entryKey,
          menuEntryLabelKey,
          adminEntry,
        );
        parentMenuTrees.push({
          entityCtx: tree.entityCtx,
          pageTreeId: tree.id,
          pageTreeUri: tree.uri,
          id:
            webSiteMenuEntriesTree.id +
            '/menuEntries/' +
            entryKey +
            '/' +
            tree.id,
          uri:
            webSiteMenuEntriesTree.uri +
            '/menuEntries/' +
            entryKey +
            '/' +
            tree.id,
          treeNode: tree.treeNode as MenuEntry,
          children: children,
          singleMenu: 0 === children.length,
          adminEntry: adminEntry,
          menuTitle: tree.treeNode[menuEntryLabelKey],
        } as MenuTree);
      } else {
        parentMenuTrees.push(
          ...(await this.lookForMenuEntries(
            tree.children,
            entryTypes,
            webSiteMenuEntriesTree,
            entryKey,
            menuEntryLabelKey,
            adminEntry,
          )),
        );
      }
    }
    return parentMenuTrees;
  }

  async completeWebSiteMenuEntriesNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    const menuEntriesProperty: IJsonSchema =
      objectNode.entityCtx?.jsonSchema?.properties?.menuEntries;
    const templateMenuEntries: {
      entryKey: string;
      entryName: string;
      entryTypes: string[];
    }[] = objectNode.webSiteTree?.treeNode?.menuEntries;
    if (menuEntriesProperty && templateMenuEntries) {
      for (const menuEntry of templateMenuEntries) {
        menuEntriesProperty.properties[menuEntry.entryKey] = {
          type: 'string',
          title: menuEntry.entryName,
        };
      }
    }
  }

  async completePageWithTemplateChoiceNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    if (objectNode.entityCtx?.jsonSchema?.properties.pageTemplateChoice) {
      const treeNode: ObjectNode = await this.objectNodeService.getTreeNode(
        objectNode,
        ctx,
      );
      if (treeNode.webSiteObjectTreeId) {
        const templatePath = treeNode.webSiteObjectTreeId.split('/');
        const templateTree = await this.objectNodeService.searchTree(
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
              intersection(
                await this.objectTypeService.getImplementedTypes(
                  objectNode.objectTypeId,
                ),
                pageTemplateChoice.pageTypes,
              ).length > 0
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
              if (pageTemplateChoice?.pageTemplateObjectTreeId) {
                objectNode.pageTemplateObjectTreeId =
                  pageTemplateChoice.pageTemplateObjectTreeId;
                const pageTemplateObjectTreeIdParts: string[] = objectNode.pageTemplateObjectTreeId.split(
                  '/',
                );
                const pageTemplateObjectTreeName =
                  pageTemplateObjectTreeIdParts[
                    pageTemplateObjectTreeIdParts.length - 1
                  ];
                if (
                  pageTemplateChoice.templatesConfigurations &&
                  pageTemplateObjectTreeName in
                    pageTemplateChoice.templatesConfigurations
                ) {
                  this.addTemplatesConfigurations(
                    objectNode,
                    pageTemplateObjectTreeName,
                    pageTemplateChoice.templatesConfigurations[
                      pageTemplateObjectTreeName
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

  async completeParagraphWithTemplateChoiceNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    if (objectNode.entityCtx?.jsonSchema?.properties.paragraphTemplateChoice) {
      const treeNode: ObjectNode = await this.objectNodeService.getTreeNode(
        objectNode,
        ctx,
      );
      if (treeNode.webSiteObjectTreeId) {
        const templatePath = treeNode.webSiteObjectTreeId.split('/');
        const templateTree = await this.objectNodeService.searchTree(
          templatePath[1],
          templatePath[2],
          templatePath[3],
          templatePath[4],
          templatePath[5],
          templatePath[6],
        );

        if (templateTree?.paragraphTemplateChoices) {
          const oneOf: {enum: {[0]: string}; title: string}[] = [];
          for (const paragraphTemplateChoice of templateTree.paragraphTemplateChoices) {
            if (
              /*
              doesTreeImplementOneOfType(
                objectNode,
                paragraphTemplateChoice.paragraphTypes,
              )*/
              -1 <
              indexOf(
                paragraphTemplateChoice.paragraphTypes,
                objectNode.objectTypeId,
              )
            ) {
              oneOf.push({
                enum: [paragraphTemplateChoice.paragraphTypeKey],
                title: paragraphTemplateChoice.paragraphTypeName,
              });
            }
          }
          if (0 < oneOf.length) {
            objectNode.entityCtx.jsonSchema.properties.paragraphTemplateChoice.oneOf = oneOf;

            if (!objectNode.paragraphTemplateChoice) {
              objectNode.paragraphTemplateChoice = oneOf[0].enum[0];
            }

            if (objectNode.paragraphTemplateChoice) {
              const paragraphTemplateChoice: ParagraphTemplateChoice = find(
                templateTree.paragraphTemplateChoices,
                (choice: ParagraphTemplateChoice) =>
                  objectNode.paragraphTemplateChoice ===
                  choice.paragraphTypeKey,
              );
              if (paragraphTemplateChoice?.paragraphTemplateObjectTreeId) {
                objectNode.paragraphTemplateObjectTreeId =
                  paragraphTemplateChoice.paragraphTemplateObjectTreeId;
                const paragraphTemplateObjectTreeIdParts: string[] = objectNode.paragraphTemplateObjectTreeId.split(
                  '/',
                );
                const paragraphTemplateObjectTreeName =
                  paragraphTemplateObjectTreeIdParts[
                    paragraphTemplateObjectTreeIdParts.length - 1
                  ];
                if (
                  paragraphTemplateChoice.templatesConfigurations &&
                  paragraphTemplateObjectTreeName in
                    paragraphTemplateChoice.templatesConfigurations
                ) {
                  this.addTemplatesConfigurations(
                    objectNode,
                    paragraphTemplateObjectTreeName,
                    paragraphTemplateChoice.templatesConfigurations[
                      paragraphTemplateObjectTreeName
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
          } else {
            delete objectNode.entityCtx.jsonSchema.properties
              .paragraphTemplateChoice;
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
      'pageTemplateObjectTreeId',
      'model.pageTemplateChoices[arrayIndex]',
      ctx,
    );
    this.addTemplatesConfigurationsReferences(objectNode);
  }

  async completeWebSiteWithParagraphsTemplateNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    await this.transientContentGenericService.addTemplateConfiguration(
      objectNode.entityCtx?.jsonSchema?.properties?.paragraphTemplateChoices
        ?.items,
      'paragraphTemplateObjectTreeId',
      'model.paragraphTemplateChoices[arrayIndex]',
      ctx,
    );
    this.addTemplatesConfigurationsReferences(objectNode);
  }

  async completePageWithSubPageNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectTree: ObjectTree = await this.insideRestService.read<ObjectTree>(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        objectNode.id as string,
        ctx,
      ),
      ctx,
    );
    const pageNodes: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(objectTree)
    )[PAGE_TYPE.name];
    objectNode.pageNodes = pageNodes
      ? pageNodes.map((tree) => tree.treeNode)
      : [];
  }

  async completePageNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    objectNode.pageId = objectNode.id;
    objectNode.siteId = objectNode.parentNamespaceId;
  }

  async completePageWithParagraphNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectTree: ObjectTree = await this.insideRestService.read<ObjectTree>(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        objectNode.id as string,
        ctx,
      ),
      ctx,
    );
    const paragraphNodes: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(objectTree)
    )[PARAGRAPH_TYPE.name];
    objectNode.paragraphNodes = paragraphNodes
      ? paragraphNodes.map((tree) => tree.treeNode)
      : [];
    /*
    objectTree.parentPageTitle = objectTree.treeNode.pageTitle
      ? objectTree.treeNode.pageTitle
      : objectTree.parentPageTitle;
    for (const paragraphTree of objectTree.paragraphNodes) {
      paragraphTree.parentPageTitle = paragraphTree.treeNode.pageTitle
        ? paragraphTree.treeNode.pageTitle
        : objectTree.parentPageTitle;
    }*/
  }

  async completeParagraphContainerNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<void> {
    return this.completePageWithParagraphNode(objectNode, ctx);
  }
}
