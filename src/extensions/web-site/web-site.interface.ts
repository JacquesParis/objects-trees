import {IEntityContext} from '@jacquesparis/objects-model';
import {ObjectNode} from '../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from '../../models/object-tree.model';

export interface PageTemplateChoice {
  pageTypeKey: string;
  pageTypeName: string;
  pageTemplateObjectTreeId: string;
  pageTypes: string[];
  templatesConfigurations?: {[templateName: string]: Object};
}

export interface ParagraphTemplateChoice {
  paragraphTypeKey: string;
  paragraphTypeName: string;
  paragraphTemplateObjectTreeId: string;
  paragraphTypes: string[];
  templatesConfigurations?: {[templateName: string]: Object};
}
export interface WebSiteTemplate extends TemplateView {
  pageTemplateTree: PageTemplate;
}

export interface WebSiteView extends ObjectNode {
  webSiteTree: WebSiteTemplate;
}

export interface MenuEntryTree extends ObjectTree {
  treeNode: ObjectNode;
  children: MenuTree[];
  disabled: boolean;
  singleMenu: boolean;
  pageTreeId?: string;
  pageTreeUri?: string;
  adminEntry: boolean;
}

export interface MenuTree extends ObjectNodeTree<MenuEntry> {
  treeNode: MenuEntry;
  pageTreeId: string;
  pageTreeUri: string;
  children: MenuTree[];
  singleMenu: boolean;
  menuTitle: string;
  adminEntry: boolean;
}

export interface WebSiteMenuEntriesTree
  extends ObjectNodeTree<WebSiteMenuEntries> {
  menuEntries: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [entryKey: string]: MenuEntryTree | any;
    uri?: string;
    entityCtx?: IEntityContext;
  };
}

export interface WebSiteMenuEntries extends WebSiteView {
  webSiteTree: WebSiteWitHMenuTemplate;
  menuTitle: string;
  menuEntries: {
    [menuKey: string]: string;
  };
}

export interface TemplateView extends ObjectNode {
  templateAngular: string;
  templateMustache: string;
  headerScript: string;
  footerScript: string;
  templatesMustache: {[templateId: string]: string};
}

export interface PageTemplate extends TemplateView {}

export interface MenuTemplate extends TemplateView {}

export interface MenuEntryDefinition {
  entryKey: string;
  entryName: string;
  menuEntryLabelKey: string;
  entryTypes: string[];
  adminEntry?: boolean;
}
export interface WebSiteWitHMenuTemplate extends WebSiteTemplate {
  menuTree: MenuTemplate;
  menuEntries: MenuEntryDefinition[];
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
