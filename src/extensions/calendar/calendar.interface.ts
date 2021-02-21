import * as moment from 'moment';
import {WebSiteMenuEntriesTree} from '../web-site/web-site.interface';

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

export interface CalendarEntryNode {
  pageTreeId: string;
  pageTreeUri: string;
  menuTitle: string;
  eventTitle: string;
  range: string;
  fromUtc: moment.Moment;
  toUtc: moment.Moment;
  from: string;
  to: string;
  treeNode: {
    id: string;
    name: string;
  };
}
