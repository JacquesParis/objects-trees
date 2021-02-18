import {TEMPLATE_VIEW_TYPE} from '../content-generic-template/content-generic-template.const';
import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {REPOSITORY_CATEGORY_TYPE} from './../../services/object-tree/object-tree.const';
import {
  PAGE_TYPE,
  PAGE_WITH_PARAGRAPH_TYPE,
  PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE,
  WEB_SITE_MENU_ENTRIES_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
} from './../web-site/web-site.const';
export const CALENDAR_PROVIDER = 'CalendarProvider';

export const CALENDAR_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'CalendarTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
};

export const CALENDAR_ENTRIES_TYPE: ObjectTypeDefinition = {
  name: 'CalendarEntries',
  inheritedTypesIds: [WEB_SITE_MENU_ENTRIES_TYPE.name],
};
export const CALENDAR_TYPE: ObjectTypeDefinition = {
  name: 'Calendar',
  inheritedTypesIds: [PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name],
  definition: {
    properties: {
      calendarEntriesObjectTreeId: {
        title: 'Calendar to be used',
        type: 'string',
        oneOfTree: [
          {
            treeType: CALENDAR_ENTRIES_TYPE.name,
          },
        ],
      },
      calendarEntryKey: {
        title: 'Calendar name',
        type: 'string',
      },
    },
  },
  iconView: 'fas fa-calendar',
};
export const CALENDAR_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'CalendarPage',
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  iconView: 'fas fa-calendar-alt',
};

export const WEB_SITE_WITH_CALENDAR_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteWithCalendar',
  inheritedTypesIds: [WEB_SITE_WITH_MENU_TEMPLATE_TYPE.name],
};

export const CALENDAR_ENTRY_TYPE: ObjectTypeDefinition = {
  name: 'CalendarEntry',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      calendarDateRange: {
        title: 'Date range',
        type: 'string',
        'x-schema-form': {
          type: 'date-range',
        },
      },
    },
  },
  contentType: '',
};

export const CATEGORY_CALENDAR_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: CALENDAR_TEMPLATE_TYPE.name,
  tree: true,
};

export const CALENDAR_PAGE_CALENDAR_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: CALENDAR_PAGE_TYPE.name,
  subTypeName: CALENDAR_TYPE.name,
};
