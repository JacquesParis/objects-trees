import {IAclCtx} from '@jacquesparis/objects-model';
import {AccessRightsCRUD} from './../services/access-rights/access-rights.const';
export class AclCtx implements IAclCtx {
  rights: AccessRightsCRUD = new AccessRightsCRUD();
}
