import {IEntityContext} from '@jacquesparis/objects-model';
import {indexOf} from 'lodash';
import {ObjectNode} from '../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from '../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';

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

export interface WebSiteMenuEntriesTree<T extends WebSiteMenuEntries>
  extends ObjectNodeTree<T> {}

export interface WebSiteMenuEntries extends WebSiteView {
  webSiteTree: WebSiteWitHMenuTemplate;
  menuTitle: string;
  menuEntries: {
    [menuKey: string]: string;
  };
  menuEntriesList: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [entryKey: string]: MenuEntryTree | any;
    uri?: string;
    entityCtx?: IEntityContext;
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

export interface Popup {
  uris: {[replaceId: string]: {pageId: string; pageName: string}};
  text: string;
}

export abstract class WebSiteEvent {
  public abstract eventType: string;
  pageTreeId: string;
  pageTreeUri: string;
  private prefixMenuTitle: string[] = [];
  menuTitle: string;
  originalMenuTitle: string;
  eventTitle: string;
  icon: string;
  hasIcon = false;
  treeNode: ObjectNode;

  public constructor(menuTree: ObjectTree) {
    this.eventTitle = menuTree.treeNode.eventTitle
      ? menuTree.treeNode.eventTitle
      : menuTree.treeNode.menuTitle
      ? menuTree.treeNode.menuTitle
      : menuTree.treeNode.pageTitle
      ? menuTree.treeNode.pageTitle
      : menuTree.treeNode.paragraphTitle
      ? menuTree.treeNode.paragraphTitle
      : '';
    this.icon = 'fas fa-splotch';
    this.menuTitle = this.eventTitle ? this.eventTitle : menuTree.treeNode.name;
    this.originalMenuTitle = menuTree.menuTitle;
    this.pageTreeId = menuTree.pageTreeId as string;
    this.pageTreeUri = menuTree.pageTreeUri;
    this.prefixMenuTitle = [];
    this.treeNode = menuTree.treeNode;

    menuTree.eventTitle = this.eventTitle;
  }

  public static async get<T extends WebSiteEvent>(
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    eventType: new (menuTree: MenuTree) => T,
    eventContributors: ((
      webSiteEvent: WebSiteEvent,
      entriesTree: ObjectTree,
      menuTree: MenuTree,
      ctx: CurrentContext,
    ) => Promise<boolean>)[],
    ctx: CurrentContext,
  ): Promise<WebSiteEvent> {
    const event: WebSiteEvent = new eventType(menuTree);
    for (const contributor of eventContributors) {
      if (!(await contributor(event, entriesTree, menuTree, ctx))) {
        break;
      }
    }

    if (
      '' === event.eventTitle ||
      undefined === event.eventTitle ||
      null === event.eventTitle
    ) {
      menuTree.eventTitle = menuTree.menuTitle;
      event.eventTitle = menuTree.eventTitle;
    } else {
      const prefixes = event.prefixMenuTitle.filter(
        (prefix) =>
          prefix !== null &&
          prefix !== undefined &&
          prefix !== '' &&
          prefix !== menuTree.evenTitle,
      );
      if (0 < prefixes.length) {
        menuTree.menuTitle = prefixes.join(', ') + ', ' + menuTree.eventTitle;
      } else {
        menuTree.menuTitle = menuTree.eventTitle;
      }
      event.menuTitle = menuTree.menuTitle;
    }
    event.hasIcon = event.icon !== 'fas fa-splotch';
    return event;
  }

  public addEventMenuTitle(titlePrefix: string, eventType: string) {
    if (this.eventType === eventType) {
      if (titlePrefix) {
        this.menuTitle = titlePrefix;
        if (-1 < indexOf(this.prefixMenuTitle, titlePrefix)) {
          this.prefixMenuTitle.splice(
            indexOf(this.prefixMenuTitle, titlePrefix),
            1,
          );
        }
        this.prefixMenuTitle.unshift(titlePrefix);
      }
    } else if (
      titlePrefix &&
      -1 === indexOf(this.prefixMenuTitle, titlePrefix)
    ) {
      this.prefixMenuTitle.push(titlePrefix);
    }
  }
  public addSpecificFields(fields: {[name: string]: unknown}) {
    Object.assign(this, fields);
  }
}
