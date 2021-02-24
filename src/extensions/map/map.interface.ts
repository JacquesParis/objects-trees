import {WebSiteMenuEntriesTree} from '../web-site/web-site.interface';
import {WebSiteEvent} from './../web-site/web-site.interface';

export interface MapEntriesTree extends WebSiteMenuEntriesTree {}

export interface MapEntryDefinition {
  key: string;
  title: string;

  positions: MapEntryNode[];
}

export interface MapDate extends MapEntryNode {}

export interface Map extends MapEntryDefinition {}

export class MapEntryNode extends WebSiteEvent {
  static TYPE = 'MAP';
  public eventType: string = MapEntryNode.TYPE;
  public position: [number, number];
}
