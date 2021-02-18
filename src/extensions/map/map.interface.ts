import {
  MenuEntry,
  WebSiteMenuEntriesTree,
} from '../web-site/web-site.interface';

export interface MapEntriesTree extends WebSiteMenuEntriesTree {}

export interface MapEntryDefinition {
  key: string;
  title: string;

  positions: MapEntryNode[];
}

export interface MapDate extends MapEntryNode {}

export interface Map extends MapEntryDefinition {}

export interface MapEntryNode {
  treeNode: MenuEntry;
  pageTreeId: string;
  pageTreeUri: string;
  menuTitle: string;
  positionTitle: string;
  position: [number, number];
  icon: string;
  popupTemplate: {
    uris: {[replaceId: string]: {pageId: string}};
    text: string;
  };
}
