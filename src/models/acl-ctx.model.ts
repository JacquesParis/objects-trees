import {IAclCtx} from '@jacquesparis/objects-model';
import {AccessRightCRUD} from './../services/access-rights/access-rights.const';
export class AclCtx implements IAclCtx {
  rights: AccessRightCRUD = new AccessRightCRUD();
}
