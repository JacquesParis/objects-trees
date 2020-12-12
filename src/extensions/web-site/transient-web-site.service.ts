import {IJsonSchema} from '@jacquesparis/objects-model';
import {inject, service} from '@loopback/core';
import {find, indexOf} from 'lodash';
import {doesTreeImplementOneOfType} from '../../helper';
import {EntityName} from '../../models';
import {CurrentContext, InsideRestService} from '../../services';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {
  WEB_SITE_VIEW_TYPE,
  WEB_SITE_VIEW_WITH_MENU_TYPE,
  WELCOME_PAGE_TYPE,
} from './web-site-type.const';
import {
  MenuEntry,
  MenuEntryTree,
  MenuTree,
  WebSiteView,
  WebSiteViewWithMenuTree,
  WebSiteWitHMenuTemplate,
} from './web-site-type.interface';

export class TransientWebSiteService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @inject('services.InsideRestService')
    private insideRestService: InsideRestService,
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
      ctx.accessRightsContexte.authorization.value,
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
}
