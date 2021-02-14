import {ObjectTreesApplicationInterface} from '../../application.interface';
import {contentGenericTemplate} from '../../helper';
import {ExtensionProvider} from '../../integration/extension.provider';
import {WebSiteProvider} from './../web-site/web-site.provider';
import {
  CALENDAR_ENTRIES_TYPE,
  CALENDAR_ENTRY_TYPE,
  CALENDAR_PAGE_CALENDAR_TEMPLATE_SUBTYPE,
  CALENDAR_PAGE_TYPE,
  CALENDAR_PROVIDER,
  CALENDAR_TEMPLATE_TYPE,
  CALENDAR_TYPE,
  CATEGORY_CALENDAR_TEMPLATE_SUBTYPE,
} from './calendar.const';
import {CalendarService} from './calendar.service';

export class CalendarProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(CALENDAR_PROVIDER, app);
    this.requiredProviders.push(WebSiteProvider);
    this.services.push({cls: CalendarService});
    this.objectTypes.push(
      CALENDAR_TEMPLATE_TYPE,
      CALENDAR_TYPE,
      CALENDAR_ENTRY_TYPE,
      CALENDAR_PAGE_TYPE,
      CALENDAR_ENTRIES_TYPE,
    );
    this.objectTrees.calendar = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'calendar',
      treeNodeTypeId: CALENDAR_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'calendar'),
        },
        children: {},
      },
    };
    this.objectSubTypes.push(
      CATEGORY_CALENDAR_TEMPLATE_SUBTYPE,
      CALENDAR_PAGE_CALENDAR_TEMPLATE_SUBTYPE,
    );
  }
}
