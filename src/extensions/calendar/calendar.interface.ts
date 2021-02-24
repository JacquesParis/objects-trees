import * as moment from 'moment';
import {WebSiteMenuEntriesTree} from '../web-site/web-site.interface';
import {WebSiteEvent} from './../web-site/web-site.interface';

export interface CalendarEntriesTree extends WebSiteMenuEntriesTree {}

export interface CalendarEntryDefinition {
  minDateUtc: moment.Moment;
  minDate: string;
  maxDateUtc: moment.Moment;
  maxDate: string;
  dates: CalendarEntryNode[];
  key: string;
  title: string;
}

export interface CalendarDate extends CalendarEntryNode {
  fromId: number;
  toId: number;
}

export interface Calendar extends CalendarEntryDefinition {
  months: {
    id: number;
    firstMonthWeekDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    monthLabel: string;
    monthDays: number;
  }[];
  days: {[day in 0 | 1 | 2 | 3 | 4 | 5 | 6]: string};
  dates: CalendarDate[];
}

export class CalendarEntryNode extends WebSiteEvent {
  static TYPE = 'CALENDAR';
  public eventType: string = CalendarEntryNode.TYPE;
  public range: string;
  public fromUtc: moment.Moment;
  public toUtc: moment.Moment;
  public from: string;
  public to: string;
}
