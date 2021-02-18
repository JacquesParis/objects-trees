import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {REPOSITORY_CATEGORY_TYPE} from './../../services/object-tree/object-tree.const';
import {TEMPLATE_VIEW_TYPE} from './../content-generic-template/content-generic-template.const';
import {
  PAGE_TYPE,
  PAGE_WITH_PARAGRAPH_TYPE,
  PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE,
  WEB_SITE_MENU_ENTRIES_TYPE,
  WEB_SITE_WITH_MENU_TEMPLATE_TYPE,
} from './../web-site/web-site.const';
export const MAP_PROVIDER = 'MapProvider';

export const MAP_TEMPLATE_TYPE: ObjectTypeDefinition = {
  name: 'MapTemplate',
  inheritedTypesIds: [TEMPLATE_VIEW_TYPE.name],
};

export const MAP_ENTRIES_TYPE: ObjectTypeDefinition = {
  name: 'MapEntries',
  inheritedTypesIds: [WEB_SITE_MENU_ENTRIES_TYPE.name],
};
export const MAP_TYPE: ObjectTypeDefinition = {
  name: 'Map',
  inheritedTypesIds: [PARAGRAPH_WITH_TEMPLATE_CHOICE_TYPE.name],
  definition: {
    properties: {
      mapEntriesObjectTreeId: {
        title: 'Map to be used',
        type: 'string',
        oneOfTree: [
          {
            treeType: MAP_ENTRIES_TYPE.name,
          },
        ],
      },
      mapEntryKey: {
        title: 'Map name',
        type: 'string',
      },
    },
  },
  iconView: 'far fa-map',
};
export const MAP_PAGE_TYPE: ObjectTypeDefinition = {
  name: 'MapPage',
  inheritedTypesIds: [PAGE_WITH_PARAGRAPH_TYPE.name],
  iconView: 'fas fa-map-marked-alt',
};

export const WEB_SITE_WITH_MAP_TYPE: ObjectTypeDefinition = {
  name: 'WebSiteWithMap',
  inheritedTypesIds: [WEB_SITE_WITH_MENU_TEMPLATE_TYPE.name],
};

export const MAP_ENTRY_TYPE: ObjectTypeDefinition = {
  name: 'MapEntry',
  inheritedTypesIds: [PAGE_TYPE.name],
  definition: {
    properties: {
      locationName: {
        title: 'Location name',
        type: 'string',
      },
      locationPosition: {
        title: 'Location position',
        type: 'string',
        'x-schema-form': {
          type: 'position',
        },
      },
      locationType: {
        title: 'Location type',
        type: 'string',
        'x-schema-form': {
          type: 'icon',
        },
        oneOf: [
          {
            enum: ['fas fa-male'],
            title: 'Person',
          },
          {
            enum: ['fas fa-paw'],
            title: 'Animals',
          },
          {
            enum: ['fas fa-map-signs'],
            title: 'Direction sign',
          },
          {
            enum: ['fas fa-map-pin'],
            title: 'Point of interest',
          },
          {
            enum: ['fas fa-crosshairs'],
            title: 'Position',
          },
          {
            enum: ['fas fa-info-circle'],
            title: 'Information',
          },
          {
            enum: ['fas fa-street-view'],
            title: 'Street view',
          },
          {
            enum: ['far fa-eye'],
            title: 'View point',
          },
          {
            enum: ['fas fa-suitcase'],
            title: 'Travel',
          },
          {
            enum: ['fas fa-shoe-prints'],
            title: 'Walk',
          },
          {
            enum: ['fas fa-hiking'],
            title: 'Hiking',
          },
          {
            enum: ['fas fa-skiing'],
            title: 'Skiing',
          },
          {
            enum: ['fas fa-snowboarding'],
            title: 'Snowboarding',
          },
          {
            enum: ['fas fa-skiing-nordic'],
            title: 'Nordic skiing',
          },
          {
            enum: ['fas fa-swimmer'],
            title: 'Swimmer',
          },
          {
            enum: ['fas fa-umbrella-beach'],
            title: 'Plage',
          },
          {
            enum: ['fas fa-life-ring'],
            title: 'Nautic',
          },
          {
            enum: ['fas fa-route'],
            title: 'Route',
          },
          {
            enum: ['fas fa-road'],
            title: 'Road',
          },
          {
            enum: ['fas fa-flag-checkered'],
            title: 'Frontier',
          },
          {
            enum: ['fas fa-parking'],
            title: 'Parking',
          },
          {
            enum: ['fas fa-ship'],
            title: 'Boat',
          },
          {
            enum: ['fas fa-train'],
            title: 'Train',
          },
          {
            enum: ['fas fa-bus'],
            title: 'Bus',
          },
          {
            enum: ['fas fa-plane'],
            title: 'Plane',
          },
          {
            enum: ['fas fa-car-side'],
            title: 'Car',
          },
          {
            enum: ['fas fa-taxi'],
            title: 'Taxi',
          },
          {
            enum: ['fas fa-bicycle'],
            title: 'Bicycle',
          },
          {
            enum: ['fas fa-motorcycle'],
            title: 'Motorcycle',
          },
          {
            enum: ['fas fa-tram'],
            title: 'Cable car',
          },
          {
            enum: ['fas fa-helicopter'],
            title: 'Helicopter',
          },
          {
            enum: ['fas fa-truck'],
            title: 'Truck',
          },
          {
            enum: ['fas fa-medkit'],
            title: 'Medical',
          },
          {
            enum: ['fas fa-h-square'],
            title: 'Hospital',
          },
          {
            enum: ['fas fa-coffee'],
            title: 'Coffee shop',
          },
          {
            enum: ['fas fa-shopping-basket'],
            title: 'Shop',
          },
          {
            enum: ['fas fa-cocktail'],
            title: 'Bar',
          },
          {
            enum: ['fas fa-landmark'],
            title: 'Monument',
          },
          {
            enum: ['fas fa-home'],
            title: 'Home',
          },
          {
            enum: ['fas fa-bed'],
            title: 'Hostel',
          },
          {
            enum: ['fas fa-tree'],
            title: 'Forest',
          },
          {
            enum: ['fas fa-swimming-pool'],
            title: 'Swimming pool',
          },
          {
            enum: ['fas fa-book'],
            title: 'Library',
          },
          {
            enum: ['far fa-building'],
            title: 'Building',
          },
          {
            enum: ['fas fa-music'],
            title: 'Concert',
          },
          {
            enum: ['fas fa-industry'],
            title: 'Industry',
          },
          {
            enum: ['fas fa-wrench'],
            title: 'Garage',
          },
        ],
      },
    },
  },
  contentType: '',
};

export const CATEGORY_MAP_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: REPOSITORY_CATEGORY_TYPE.name,
  subTypeName: MAP_TEMPLATE_TYPE.name,
  tree: true,
};

export const MAP_PAGE_MAP_TEMPLATE_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: MAP_PAGE_TYPE.name,
  subTypeName: MAP_TYPE.name,
};
