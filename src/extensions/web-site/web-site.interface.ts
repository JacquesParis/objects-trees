import {IEntityContext} from '@jacquesparis/objects-model';
import {ObjectNode} from '../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from '../../models/object-tree.model';
export interface WebSiteTemplate extends TemplateView {
  pageObjectTree: PageTemplate;
}

export interface WebSiteView extends ObjectNode {
  webSiteObjectTree: WebSiteTemplate;
}

export interface MenuEntryTree extends ObjectTree {
  treeNode: ObjectNode;
  children: MenuTree[];
  disabled: boolean;
  singleMenu: boolean;
  pageTreeId?: string;
  pageTreeUri?: string;
}

export interface MenuTree extends ObjectNodeTree<MenuEntry> {
  treeNode: MenuEntry;
  pageTreeId: string;
  pageTreeUri: string;
  children: MenuTree[];
  singleMenu: boolean;
  menuTitle: string;
}

export interface WebSiteViewWithMenuTree
  extends ObjectNodeTree<WebSiteViewWithMenu> {
  menuEntries: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [entryKey: string]: MenuEntryTree | any;
    uri?: string;
    entityCtx?: IEntityContext;
  };
}

export interface WebSiteViewWithMenu extends WebSiteView {
  webSiteObjectTree: WebSiteWitHMenuTemplate;
  menuTitle: string;
  menuEntries: {
    [menuKey: string]: string;
  };
}

export interface TemplateView extends ObjectNode {
  template: string;
}

export interface PageTemplate extends TemplateView {}

export interface MenuTemplate extends TemplateView {}

export interface WebSiteWitHMenuTemplate extends WebSiteTemplate {
  menuObjectTree: MenuTemplate;
  menuEntries: {
    entryKey: string;
    entryName: string;
    menuEntryLabelKey: string;
    entryTypes: string[];
  }[];
}

export interface Page extends ObjectNode {
  pageTitle: string;
}

export interface WelcomePage extends Page {}

export interface MenuEntry extends Page {
  menuTitle: string;
}

export interface CalendarEntry extends Page {
  calendarDate: string;
}
