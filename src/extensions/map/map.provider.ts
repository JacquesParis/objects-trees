import {ObjectTreesApplicationInterface} from '../../application.interface';
import {contentGenericTemplate} from '../../helper';
import {ExtensionProvider} from '../../integration/extension.provider';
import {WebSiteProvider} from './../web-site/web-site.provider';
import {
  CATEGORY_MAP_TEMPLATE_SUBTYPE,
  MAP_ENTRIES_TYPE,
  MAP_ENTRY_TYPE,
  MAP_PAGE_MAP_TEMPLATE_SUBTYPE,
  MAP_PAGE_TYPE,
  MAP_PROVIDER,
  MAP_TEMPLATE_TYPE,
  MAP_TYPE,
} from './map.const';
import {MapService} from './map.service';

export class MapProvider extends ExtensionProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(MAP_PROVIDER, app);

    app.addStaticDir(
      'markercluster',
      'node_modules/leaflet.markercluster/dist',
    );

    this.requiredProviders.push(WebSiteProvider);
    this.services.push({cls: MapService});
    this.objectTypes.push(
      MAP_TEMPLATE_TYPE,
      MAP_TYPE,
      MAP_ENTRY_TYPE,
      MAP_PAGE_TYPE,
      MAP_ENTRIES_TYPE,
    );
    this.objectTrees.map = {
      reset: false,
      parentNode: () => this.appCtx.publicTemplatesNode.value,
      treeNodeName: 'map',
      treeNodeTypeId: MAP_TEMPLATE_TYPE.name,
      tree: {
        treeNode: {
          contentGenericTemplate: contentGenericTemplate(__dirname, 'map'),
        },
        children: {},
      },
    };
    this.objectSubTypes.push(
      CATEGORY_MAP_TEMPLATE_SUBTYPE,
      MAP_PAGE_MAP_TEMPLATE_SUBTYPE,
    );
  }
}
