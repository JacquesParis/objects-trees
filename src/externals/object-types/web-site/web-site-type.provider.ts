import {ObjectTreesApplicationInterface} from '../../../application';
import {ObjectTypeProvider} from './../../../integration/object-types/object-type.provider';
import {
  TEMPLATE_VIEW_TYPE,
  WEB_SITE_NAME,
  WEB_SITE_TEMPLATE_TYPE,
} from './web-site-type.const';

export class WebSiteTypeProvider extends ObjectTypeProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(WEB_SITE_NAME, app);
    this.objectTypes.types.templateViewType = TEMPLATE_VIEW_TYPE;
    this.objectTypes.types.webSite = WEB_SITE_TEMPLATE_TYPE;
  }
}
