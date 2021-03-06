/* eslint-disable no-empty */
import {service} from '@loopback/core';
import {indexOf, intersection, isEqual} from 'lodash';
import * as moment from 'moment';
import {TransientWebSiteService} from '../web-site/transient-web-site.service';
import {
  MenuEntryDefinition,
  WebSiteEvent,
} from '../web-site/web-site.interface';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {
  MenuTree,
  WebSiteWitHMenuTemplate,
} from './../web-site/web-site.interface';
import {PopupBuilder, WebSiteService} from './../web-site/web-site.service';
import {
  CALENDAR_ENTRIES_TYPE,
  CALENDAR_ENTRY_TYPE,
  CALENDAR_PROVIDER,
  CALENDAR_TYPE,
} from './calendar.const';
import {
  Calendar,
  CalendarEntries,
  CalendarEntriesTree,
  CalendarEntryDefinition,
  CalendarEntryNode,
} from './calendar.interface';

export class CalendarService {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
    @service(InsideRestService) protected insideRestService: InsideRestService,
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(UriCompleteService)
    protected uriCompleteService: UriCompleteService,
    @service(TransientWebSiteService)
    protected transientWebSiteService: TransientWebSiteService,
    @service(WebSiteService)
    private webSiteService: WebSiteService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      CALENDAR_PROVIDER,
      CalendarService.name,
      'Build calendar entries',
      EntityName.objectNode,
      CALENDAR_ENTRIES_TYPE.name,
      this.completeCalendarEntriesNode.bind(this),
    );

    this.transientEntityService.registerTransientEntityTypeFunction(
      CALENDAR_PROVIDER,
      CalendarService.name,
      'Add calendar references to calendar paragraph',
      EntityName.objectNode,
      CALENDAR_TYPE.name,
      this.completeCalendarNode.bind(this),
    );
    this.webSiteService.registerEventContributor(
      this.contributeToEvent.bind(this),
    );
    this.webSiteService.registerPopupContributor(
      this.contributeToPopup.bind(this),
    );
  }

  public async completeCalendarNode(
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ) {
    if (
      !objectNode.calendarEntriesObjectTreeId &&
      objectNode.entityCtx?.jsonSchema?.properties?.calendarEntriesObjectTreeId
        ?.oneOf &&
      objectNode.entityCtx.jsonSchema.properties.calendarEntriesObjectTreeId
        .oneOf.length > 0
    ) {
      objectNode.calendarEntriesObjectTreeId =
        objectNode.entityCtx.jsonSchema.properties.calendarEntriesObjectTreeId.oneOf[0].enum[0];
    }
    if (
      objectNode.calendarEntriesObjectTreeId &&
      !objectNode.calendarEntriesObjectTreeUri
    ) {
      objectNode.calendarEntriesObjectTreeUri = this.uriCompleteService.getUri(
        EntityName.objectTree,
        objectNode.calendarEntriesObjectTreeId,
        ctx,
      );
    }
    if (objectNode.calendarEntriesObjectTreeId) {
      objectNode.calendarEntriesObjectNodeUri = this.uriCompleteService.getUri(
        EntityName.objectNode,
        objectNode.calendarEntriesObjectTreeId,
        ctx,
      );
    }

    if (objectNode.calendarEntriesObjectNodeUri) {
      try {
        const calendarEntriesNode: CalendarEntries = (await this.insideRestService.read(
          objectNode.calendarEntriesObjectNodeUri,
          ctx,
        )) as CalendarEntries;
        if (calendarEntriesNode?.calendarEntriesList) {
          const oneOf = [];
          for (const entryKey of Object.keys(
            calendarEntriesNode.calendarEntriesList,
          )) {
            oneOf.push({
              enum: [entryKey],
              title: calendarEntriesNode.calendarEntriesList[entryKey].title,
            });
          }
          if (
            0 < oneOf.length &&
            objectNode.entityCtx?.jsonSchema?.properties?.calendarEntryKey
          ) {
            objectNode.entityCtx.jsonSchema.properties.calendarEntryKey.oneOf = oneOf;
            if (!objectNode.calendarEntryKey) {
              objectNode.calendarEntryKey = oneOf[0].enum[0];
            }
          }
        }
      } catch (error) {}
    }

    if (
      objectNode.calendarEntriesObjectNodeUri &&
      objectNode.calendarEntryKey
    ) {
      try {
        const calendarEntriesNode: CalendarEntries = (await this.insideRestService.read(
          objectNode.calendarEntriesObjectNodeUri,
          ctx,
        )) as CalendarEntries;
        moment.locale(ctx.uriContext.uri.value.acceptLanguage);
        const calendar: Calendar = calendarEntriesNode.calendarEntriesList[
          objectNode.calendarEntryKey
        ] as Calendar;
        const minDate = moment.utc(calendar.minDate);
        const maxDate = moment.utc(calendar.maxDate);
        calendar.months = [];
        for (
          let month = moment.default(minDate).startOf('month');
          !month.isAfter(maxDate);
          month = month.add(1, 'month')
        ) {
          calendar.months.push({
            firstMonthWeekDay: ((month.startOf('month').day() + 6) % 7) as
              | 0
              | 1
              | 2
              | 3
              | 4
              | 5
              | 6,
            monthLabel: month.format('MMMM YYYY'),
            monthDays: moment.default(month).endOf('month').date(),
            id: month.year() * 10000 + month.month() * 100,
          });
        }
        for (const date of calendar.dates) {
          const from = moment.utc(date.from);
          date.fromId = from.year() * 10000 + from.month() * 100 + from.date();
          const to = moment.utc(date.to);
          date.toId = to.year() * 10000 + to.month() * 100 + to.date();
        }
        calendar.dates.sort((a, b) => a.fromId - b.fromId);

        calendar.days = {
          0: moment.default().day(1).format('ddd'),
          1: moment.default().day(2).format('ddd'),
          2: moment.default().day(3).format('ddd'),
          3: moment.default().day(4).format('ddd'),
          4: moment.default().day(5).format('ddd'),
          5: moment.default().day(6).format('ddd'),
          6: moment.default().day(0).format('ddd'),
        };

        objectNode.calendar = calendar;
      } catch (error) {}
    }
  }

  public async getCalendarMenuEntries(
    entriesTree: ObjectTree,
    calendarMenus: MenuTree[],
    menuEntryDef: MenuEntryDefinition,
    ctx: CurrentContext,
  ): Promise<CalendarEntryDefinition> {
    let dates: CalendarEntryDefinition = (undefined as unknown) as CalendarEntryDefinition;
    if (0 < calendarMenus.length) {
      const initRange = this.getDateRange(calendarMenus[0].menuTitle);
      dates = {
        minDateUtc: initRange.from,
        maxDateUtc: initRange.to,
        minDate: initRange.from.format('YYYY-MM-DD'),
        maxDate: initRange.to.format('YYYY-MM-DD'),
        dates: [],
        key: menuEntryDef.entryKey,
        title: menuEntryDef.entryName,
      };
      await this.buildCalendarDates(entriesTree, dates, calendarMenus, ctx);
    }
    return dates;
  }

  public async completeCalendarEntriesNode(
    calenderEntriesNode: CalendarEntries,
    ctx: CurrentContext,
  ) {
    calenderEntriesNode.calendarEntriesList = {};
    try {
      const webSiteTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
        calenderEntriesNode.webSiteObjectTreeUri,
        ctx,
      )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;
      const implementingCalendarEntry = await this.objectTypeService.getImplementingTypes(
        CALENDAR_ENTRY_TYPE.name,
      );
      for (const menuEntryDef of webSiteTree.treeNode.menuEntries) {
        if (
          intersection(implementingCalendarEntry, menuEntryDef.entryTypes)
            .length > 0
        ) {
          const calenderEntriesTree: CalendarEntriesTree = (await this.insideRestService.read(
            this.uriCompleteService.getUri(
              EntityName.objectTree,
              calenderEntriesNode.id as string,
              ctx,
            ),
            ctx,
          )) as CalendarEntriesTree;

          const menuTrees: MenuTree[] =
            calenderEntriesNode.menuEntriesList &&
            menuEntryDef.entryKey in calenderEntriesNode.menuEntriesList
              ? calenderEntriesNode.menuEntriesList[menuEntryDef.entryKey]
                  .children
              : await this.transientWebSiteService.lookForMenuEntries(
                  [calenderEntriesTree],
                  menuEntryDef.entryTypes,
                  calenderEntriesTree,
                  menuEntryDef.entryKey,
                  menuEntryDef.menuEntryLabelKey
                    ? menuEntryDef.menuEntryLabelKey
                    : 'name',
                  !!menuEntryDef.adminEntry,
                );
          calenderEntriesNode.calendarEntriesList[
            menuEntryDef.entryKey
          ] = await this.getCalendarMenuEntries(
            calenderEntriesTree,
            menuTrees,
            menuEntryDef,
            ctx,
          );
        }
      }
    } catch (error) {}
  }

  async buildCalendarDates(
    entriesTree: ObjectTree,
    dates: CalendarEntryDefinition,
    children: MenuTree[],
    ctx: CurrentContext,
  ) {
    for (const calendarEntry of children) {
      const newDate = await this.buildCalendarEntry(
        entriesTree,
        calendarEntry,
        ctx,
      );
      if (newDate) {
        if (newDate.fromUtc?.isBefore(dates.minDateUtc)) {
          dates.minDateUtc = newDate.fromUtc;
          dates.minDate = dates.minDateUtc.format('YYYY-MM-DD');
        }
        if (newDate.toUtc?.isAfter(dates.maxDateUtc)) {
          dates.maxDateUtc = newDate.toUtc;
          dates.maxDate = dates.maxDateUtc.format('YYYY-MM-DD');
        }
        dates.dates.push(newDate);
      }
      if (calendarEntry.children && 0 < calendarEntry.children.length) {
        await this.buildCalendarDates(
          entriesTree,
          dates,
          calendarEntry.children,
          ctx,
        );
      }
    }
  }

  public async buildCalendarEntry(
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    ctx: CurrentContext,
  ): Promise<CalendarEntryNode | undefined> {
    let event: CalendarEntryNode | undefined = undefined;
    if (menuTree.treeNode.calendarDateRange) {
      event = await this.webSiteService.buildEvent<CalendarEntryNode>(
        entriesTree,
        menuTree,
        CalendarEntryNode,
        ctx,
      );
    }

    return event;
  }

  public async contributeToEvent(
    webSiteEvent: WebSiteEvent,
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    ctx: CurrentContext,
  ): Promise<boolean> {
    if (menuTree.treeNode.calendarDateRange) {
      const range = this.getDateRange(menuTree.treeNode.calendarDateRange);
      menuTree.range = menuTree.treeNode.calendarDateRange;
      moment.locale(ctx.uriContext.uri.value.acceptLanguage);
      let menuTitle = range.from.format('LL');
      if (!isEqual(range.from, range.to)) {
        menuTitle += ' - ' + range.to.format('LL');
      }
      webSiteEvent.addEventMenuTitle(menuTitle, CalendarEntryNode.TYPE);
      webSiteEvent.addSpecificFields({
        range: menuTree.range,
        fromUtc: range.from,
        toUtc: range.to,
        from: range.from.format('YYYY-MM-DD'),
        to: range.to.format('YYYY-MM-DD'),
      });
    }
    return true;
  }

  public async contributeToPopup(
    popupNode: ObjectNode,
    builder: PopupBuilder,
    ctx: CurrentContext,
  ): Promise<boolean> {
    if (popupNode.calendarDateRange) {
      const range = this.getDateRange(popupNode.calendarDateRange);
      popupNode = popupNode.calendarDateRange;
      moment.locale(ctx.uriContext.uri.value.acceptLanguage);
      let menuTitle = range.from.format('LL');
      if (!isEqual(range.from, range.to)) {
        menuTitle += ' - ' + range.to.format('LL');
      }
      if (
        menuTitle &&
        -1 === indexOf(builder.popupParts.subTitleParts, menuTitle) &&
        menuTitle !== builder.popupParts.title
      ) {
        builder.popupParts.subTitleParts.push(menuTitle);
      }
    }

    return true;
  }

  protected getDateRange(
    dateRange: string,
  ): {from: moment.Moment; to: moment.Moment} {
    const dates: {from: moment.Moment; to: moment.Moment} = {
      from: moment.utc(),
      to: moment.utc(),
    };
    if ('' !== dateRange) {
      const ranges = dateRange.split(' ');
      if (2 === ranges.length) {
        dates.from = moment.utc(ranges[0]);
        dates.to = moment.utc(ranges[1]);
      }
    }
    return dates;
  }
}
