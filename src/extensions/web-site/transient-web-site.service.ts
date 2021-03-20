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
      'Add menuEntries, tree of site menu entries',
      EntityName.objectTree,
      WEB_SITE_MENU_ENTRIES_TYPE.name,
      this.completeWebSiteMenuEntries.bind(this),
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

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectTree>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add pageTrees field, list of sub-pages',
      EntityName.objectTree,
      PAGE_WITH_SUB_PAGE_TYPE.name,
      this.completePageWithSubPageTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectTree>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add paragraphTrees field, list of paragraphs',
      EntityName.objectTree,
      PAGE_WITH_PARAGRAPH_TYPE.name,
      this.completePageWithParagraphTree.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction<ObjectTree>(
      WEB_SITE_PROVIDER,
      TransientWebSiteService.name,
      'Add paragraphTrees field, list of paragraphs',
      EntityName.objectTree,
      PARAGRAPH_CONTAINER_TYPE.name,
      this.completeParagraphContainerTree.bind(this),
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

  async completeWebSiteMenuEntries(
    webSiteMenuEntriesTree: WebSiteMenuEntriesTree,
    ctx: CurrentContext,
  ) {
    webSiteMenuEntriesTree.menuEntries = {
      entityCtx: webSiteMenuEntriesTree.treeNode.entityCtx,
      uri: webSiteMenuEntriesTree.treeNode.uri + '/menuEntries',
      id: webSiteMenuEntriesTree.treeNode.id + '/menuEntries',
    };

    try {
      const webSiteTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
        webSiteMenuEntriesTree.treeNode.webSiteObjectTreeUri,
        ctx,
      )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;

      if (webSiteMenuEntriesTree.treeNode.menuEntries) {
        for (const menuEntry of webSiteTree.treeNode.menuEntries) {
          if (webSiteMenuEntriesTree.treeNode.menuEntries[menuEntry.entryKey]) {
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
            webSiteMenuEntriesTree.menuEntries[menuEntry.entryKey] = ({
              entityCtx: webSiteMenuEntriesTree.entityCtx,
              treeNode: webSiteMenuEntriesTree.treeNode,
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
              webSiteMenuEntriesTree.menuEntries[menuEntry.entryKey]
                .singleMenu &&
              !webSiteMenuEntriesTree.menuEntries[menuEntry.entryKey].disabled
            ) {
              webSiteMenuEntriesTree.menuEntries[
                menuEntry.entryKey
              ].pageTreeId = children[0].pageTreeId;
              webSiteMenuEntriesTree.menuEntries[
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
    webSiteMenuEntriesTree: WebSiteMenuEntriesTree,
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

  async completePageWithSubPageTree(
    entity: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    const pageTrees: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(entity)
    )[PAGE_TYPE.name];
    entity.pageTrees = pageTrees ? pageTrees : [];
  }

  async completePageWithParagraphTree(
    entity: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    const paragraphTrees: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplementedTypeId(entity)
    )[PARAGRAPH_TYPE.name];
    entity.paragraphTrees = paragraphTrees ? paragraphTrees : [];
    entity.parentPageTitle = entity.treeNode.pageTitle
      ? entity.treeNode.pageTitle
      : entity.parentPageTitle;
    for (const paragraphTree of entity.paragraphTrees) {
      paragraphTree.parentPageTitle = paragraphTree.treeNode.pageTitle
        ? paragraphTree.treeNode.pageTitle
        : entity.parentPageTitle;
    }
  }

  async completeParagraphContainerTree(
    entity: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    return this.completePageWithParagraphTree(entity, ctx);
  }
}
