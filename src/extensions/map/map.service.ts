/* eslint-disable no-empty */
import {service} from '@loopback/core';
import {indexOf, intersection} from 'lodash';
import {
  WebSiteEvent,
  WebSiteWitHMenuTemplate,
} from '../web-site/web-site.interface';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectNodeTree, ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {TransientWebSiteService} from './../web-site/transient-web-site.service';
import {MenuEntryDefinition, MenuTree} from './../web-site/web-site.interface';
import {PopupBuilder, WebSiteService} from './../web-site/web-site.service';
import {
  MAP_ENTRIES_TYPE,
  MAP_ENTRY_TYPE,
  MAP_PROVIDER,
  MAP_TYPE,
} from './map.const';
import {
  Map,
  MapEntries,
  MapEntriesTree,
  MapEntryDefinition,
  MapEntryNode,
} from './map.interface';
export class MapService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService) private insideRestService: InsideRestService,
    @service(ObjectTypeService) private objectTypeService: ObjectTypeService,
    @service(UriCompleteService)
    private uriCompleteService: UriCompleteService,
    @service(TransientWebSiteService)
    private transientWebSiteService: TransientWebSiteService,
    @service(WebSiteService)
    private webSiteService: WebSiteService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction(
      MAP_PROVIDER,
      MapService.name,
      'Build map entries',
      EntityName.objectNode,
      MAP_ENTRIES_TYPE.name,
      this.completeMapEntriesNode.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      MAP_PROVIDER,
      MapService.name,
      'Add map references to map paragraph',
      EntityName.objectNode,
      MAP_TYPE.name,
      this.completeMapNode.bind(this),
    );
    this.webSiteService.registerEventContributor(
      this.contributeToEvent.bind(this),
    );
    this.webSiteService.registerPopupContributor(
      this.contributeToPopup.bind(this),
    );
  }

  public async completeMapNode(objectNode: ObjectNode, ctx: CurrentContext) {
    if (
      !objectNode.mapEntriesObjectTreeId &&
      objectNode.entityCtx?.jsonSchema?.properties?.mapEntriesObjectTreeId
        ?.oneOf &&
      objectNode.entityCtx.jsonSchema.properties.mapEntriesObjectTreeId.oneOf
        .length > 0
    ) {
      objectNode.mapEntriesObjectTreeId =
        objectNode.entityCtx.jsonSchema.properties.mapEntriesObjectTreeId.oneOf[0].enum[0];
    }
    if (
      objectNode.mapEntriesObjectTreeId &&
      !objectNode.mapEntriesObjectTreeUri
    ) {
      objectNode.mapEntriesObjectTreeUri = this.uriCompleteService.getUri(
        EntityName.objectTree,
        objectNode.mapEntriesObjectTreeId,
        ctx,
      );
    }
    if (objectNode.mapEntriesObjectTreeId) {
      objectNode.mapEntriesObjectNodeUri = this.uriCompleteService.getUri(
        EntityName.objectNode,
        objectNode.mapEntriesObjectTreeId,
        ctx,
      );
    }
    if (objectNode.mapEntriesObjectNodeUri) {
      try {
        const mapEntriesNode: MapEntries = (await this.insideRestService.read(
          objectNode.mapEntriesObjectNodeUri,
          ctx,
        )) as MapEntries;
        if (mapEntriesNode.mapEntriesList) {
          const oneOf = [];
          for (const entryKey of Object.keys(mapEntriesNode.mapEntriesList)) {
            oneOf.push({
              enum: [entryKey],
              title: mapEntriesNode.mapEntriesList[entryKey].title,
            });
          }
          if (
            0 < oneOf.length &&
            objectNode.entityCtx?.jsonSchema?.properties?.mapEntryKey
          ) {
            objectNode.entityCtx.jsonSchema.properties.mapEntryKey.oneOf = oneOf;
            if (!objectNode.mapEntryKey) {
              objectNode.mapEntryKey = oneOf[0].enum[0];
            }
          }
        }
      } catch (error) {}
    }

    if (objectNode.mapEntriesObjectNodeUri && objectNode.mapEntryKey) {
      try {
        const mapEntriesNode: MapEntries = (await this.insideRestService.read(
          objectNode.mapEntriesObjectNodeUri,
          ctx,
        )) as MapEntries;
        const map: Map = mapEntriesNode.mapEntriesList[objectNode.mapEntryKey];
        objectNode.map = map;
      } catch (error) {}
    }
  }

  public async getMapMenuEntries(
    entriesTree: ObjectTree,
    mapMenus: MenuTree[],
    menuEntryDef: MenuEntryDefinition,
    ctx: CurrentContext,
  ): Promise<MapEntryDefinition> {
    let positions: MapEntryDefinition = (undefined as unknown) as MapEntryDefinition;
    if (0 < mapMenus.length) {
      positions = {
        key: menuEntryDef.entryKey,
        title: menuEntryDef.entryName,
        positions: [],
      };
      await this.buildMapPositions(entriesTree, positions, mapMenus, ctx);
    }
    return positions;
  }

  async buildMapPositions(
    entriesTree: ObjectTree,
    positions: MapEntryDefinition,
    children: MenuTree[],
    ctx: CurrentContext,
  ) {
    for (const mapEntry of children) {
      const newPosition = await this.buildMapEntry(entriesTree, mapEntry, ctx);
      if (newPosition) {
        positions.positions.push(newPosition);
      }
      if (mapEntry.children && 0 < mapEntry.children.length) {
        await this.buildMapPositions(
          entriesTree,
          positions,
          mapEntry.children,
          ctx,
        );
      }
    }
  }

  public async buildMapEntry(
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    ctx: CurrentContext,
  ): Promise<MapEntryNode | undefined> {
    if (
      menuTree.treeNode.locationPosition &&
      2 === menuTree.treeNode.locationPosition.split(',').length
    ) {
      return this.webSiteService.buildEvent<MapEntryNode>(
        entriesTree,
        menuTree,
        MapEntryNode,
        ctx,
      );
    }
    return undefined;
  }

  public async contributeToEvent(
    webSiteEvent: WebSiteEvent,
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    ctx: CurrentContext,
  ): Promise<boolean> {
    if (menuTree.treeNode.locationPosition) {
      const positionParts = menuTree.treeNode.locationPosition.split(',');
      if (2 === positionParts.length) {
        const position: [number, number] = [
          Number(positionParts[0]),
          Number(positionParts[1]),
        ];
        webSiteEvent.addEventMenuTitle(
          menuTree.treeNode.locationName,
          MapEntryNode.TYPE,
        );
        webSiteEvent.addSpecificFields({
          position: position,
          icon: menuTree.treeNode.locationType
            ? menuTree.treeNode.locationType
            : 'fas fa-splotch',
        });
      }
    }
    return true;
  }

  public async contributeToPopup(
    popupNode: ObjectNode,
    builder: PopupBuilder,
    ctx: CurrentContext,
  ): Promise<boolean> {
    if (
      popupNode.locationName &&
      '' !== popupNode.locationName &&
      -1 ===
        indexOf(builder.popupParts.subTitleParts, popupNode.locationName) &&
      popupNode.locationName !== builder.popupParts.title
    ) {
      builder.popupParts.subTitleParts.push(popupNode.locationName);
    }
    return true;
  }

  public async completeMapEntriesNode(
    mapEntriesNode: MapEntries,
    ctx: CurrentContext,
  ) {
    mapEntriesNode.mapEntriesList = {};
    try {
      const webSiteTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
        mapEntriesNode.webSiteObjectTreeUri,
        ctx,
      )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;
      const implementingMapEntry = await this.objectTypeService.getImplementingTypes(
        MAP_ENTRY_TYPE.name,
      );
      for (const menuEntryDef of webSiteTree.treeNode.menuEntries) {
        if (
          intersection(implementingMapEntry, menuEntryDef.entryTypes).length > 0
        ) {
          const mapEntriesTree: MapEntriesTree = (await this.insideRestService.read(
            this.uriCompleteService.getUri(
              EntityName.objectTree,
              mapEntriesNode.id as string,
              ctx,
            ),
            ctx,
          )) as MapEntriesTree;

          const menuTrees: MenuTree[] =
            mapEntriesNode.menuEntriesList &&
            menuEntryDef.entryKey in mapEntriesNode.menuEntriesList
              ? mapEntriesNode.menuEntriesList[menuEntryDef.entryKey].children
              : await this.transientWebSiteService.lookForMenuEntries(
                  [mapEntriesTree],
                  menuEntryDef.entryTypes,
                  mapEntriesTree,
                  menuEntryDef.entryKey,
                  menuEntryDef.menuEntryLabelKey
                    ? menuEntryDef.menuEntryLabelKey
                    : 'name',
                  !!menuEntryDef.adminEntry,
                );
          mapEntriesNode.mapEntriesList[
            menuEntryDef.entryKey
          ] = await this.getMapMenuEntries(
            mapEntriesTree,
            menuTrees,
            menuEntryDef,
            ctx,
          );
        }
      }
    } catch (error) {}
  }
}
