import {WebSiteMenuEntriesTree} from '../web-site/web-site.interface';

export interface MapEntriesTree extends WebSiteMenuEntriesTree {}

export interface MapEntryDefinition {
  key: string;
  title: string;

  positions: MapEntryNode[];
}

export interface MapDate extends MapEntryNode {}

export interface Map extends MapEntryDefinition {}

export interface MapEntryNode {
  pageTreeId: string;
  pageTreeUri: string;
  menuTitle: string;
  positionTitle: string;
  position: [number, number];
  icon: string;
  treeNode: {id: string; name: string};
}
