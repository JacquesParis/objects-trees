import {ObjectTreesApplicationInterface} from '../../../application';
import {ObjectTypeProvider} from './../../../integration/object-types/object-type.provider';
import {WEB_SITE_NAME} from './web-site-type.const';

export class WebSiteTypeProvider extends ObjectTypeProvider {
  constructor(protected app: ObjectTreesApplicationInterface) {
    super(WEB_SITE_NAME, app);
  }
}
