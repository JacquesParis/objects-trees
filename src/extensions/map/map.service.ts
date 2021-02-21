import {service} from '@loopback/core';
import {intersection} from 'lodash';
import {WebSiteWitHMenuTemplate} from '../web-site/web-site.interface';
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
import {WebSiteService} from './../web-site/web-site.service';
import {
  MAP_ENTRIES_TYPE,
  MAP_ENTRY_TYPE,
  MAP_PROVIDER,
  MAP_TYPE,
} from './map.const';
import {
  Map,
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
      EntityName.objectTree,
      MAP_ENTRIES_TYPE.name,
      this.completeMapEntriesTree.bind(this),
    );
    this.transientEntityService.registerTransientEntityTypeFunction(
      MAP_PROVIDER,
      MapService.name,
      'Add map references to map paragraph',
      EntityName.objectNode,
      MAP_TYPE.name,
      this.completeMapNode.bind(this),
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
    if (objectNode.mapEntriesObjectTreeUri) {
      const mapEntries = await this.insideRestService.read(
        objectNode.mapEntriesObjectTreeUri,
        ctx,
      );
      if (mapEntries.mapEntries) {
        const oneOf = [];
        for (const entryKey of Object.keys(mapEntries.mapEntries)) {
          oneOf.push({
            enum: [entryKey],
            title: mapEntries.mapEntries[entryKey].title,
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
    }

    if (objectNode.mapEntriesObjectTreeUri && objectNode.mapEntryKey) {
      const mapEntries = await this.insideRestService.read(
        objectNode.mapEntriesObjectTreeUri,
        ctx,
      );
      const map: Map = mapEntries.mapEntries[objectNode.mapEntryKey];
      objectNode.map = map;
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
    const positionParts = menuTree.menuTitle.split(',');
    if (2 === positionParts.length) {
      const position: [number, number] = [
        Number(positionParts[0]),
        Number(positionParts[1]),
      ];

      menuTree.position = menuTree.menuTitle;
      menuTree.menuTitle = menuTree.treeNode.locationName;
      menuTree.positionTitle = menuTree.treeNode.eventTitle
        ? menuTree.treeNode.eventTitle
        : menuTree.treeNode.menuTitle
        ? menuTree.treeNode.menuTitle
        : menuTree.treeNode.pageTitle
        ? menuTree.treeNode.pageTitle
        : menuTree.treeNode.paragraphTitle
        ? menuTree.treeNode.paragraphTitle
        : '';
      if (!menuTree.menuTitle) {
        menuTree.menuTitle =
          '' === menuTree.positionTitle
            ? menuTree.treeNode.name
            : menuTree.positionTitle;
      } else if ('' !== menuTree.positionTitle) {
        menuTree.menuTitle += ': ' + menuTree.positionTitle;
      }
      if ('' === menuTree.positionTitle) {
        menuTree.positionTitle = menuTree.menuTitle;
      }
      return {
        pageTreeId: menuTree.pageTreeId,
        pageTreeUri: menuTree.pageTreeUri,
        menuTitle: menuTree.menuTitle,
        positionTitle: menuTree.positionTitle,
        position: position,
        icon: menuTree.treeNode.locationType
          ? menuTree.treeNode.locationType
          : 'fas fa-splotch',
        treeNode: {
          id: menuTree.treeNode.id as string,
          name: menuTree.treeNode.name,
        },
      };
    }
    return undefined;
  }

  public async completeMapEntriesTree(
    mapEntriesTree: MapEntriesTree,
    ctx: CurrentContext,
  ) {
    mapEntriesTree.mapEntries = {};
    const webSiteTree: ObjectNodeTree<WebSiteWitHMenuTemplate> = (await this.insideRestService.read(
      mapEntriesTree.treeNode.webSiteObjectTreeUri,
      ctx,
    )) as ObjectNodeTree<WebSiteWitHMenuTemplate>;
    const implementingMapEntry = await this.objectTypeService.getImplementingTypes(
      MAP_ENTRY_TYPE.name,
    );
    for (const menuEntryDef of webSiteTree.treeNode.menuEntries) {
      if (
        intersection(implementingMapEntry, menuEntryDef.entryTypes).length > 0
      ) {
        const menuTrees: MenuTree[] =
          mapEntriesTree.menuEntries &&
          menuEntryDef.entryKey in mapEntriesTree.menuEntries
            ? mapEntriesTree.menuEntries[menuEntryDef.entryKey].children
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
        mapEntriesTree.mapEntries[
          menuEntryDef.entryKey
        ] = await this.getMapMenuEntries(
          mapEntriesTree,
          menuTrees,
          menuEntryDef,
          ctx,
        );
      }
    }
  }
}
