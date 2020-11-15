import {IRestEntity} from '@jacquesparis/objects-model';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {CurrentContext} from '../application.service';
import {AclCtx} from './../../models/acl-ctx.model';
import {EntityName} from './../../models/entity-name';
import {ObjectType} from './../../models/object-type.model';
import {AccessRightAbstractService} from './access-rights-abtract.service';
import {
  AccessRightsProvider,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightTypeService
  extends AccessRightAbstractService
  implements AccessRightsProvider {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
  ) {
    super(accessRightsService, EntityName.objectType);
  }

  public async cleanReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const user: ObjectType = entity as ObjectType;
    if (!user?.aclCtx) {
      user.aclCtx = new AclCtx();
    }
    user.aclCtx.rights.read = true;
    // TODO: check admin and registered objects during boot for CRUD
    // TODO: remove subTypes for non admin;
  }
  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: check admin
    return AuthorizationDecision.ALLOW;
  }
  protected async authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: allow for admin ?
    return AuthorizationDecision.DENY;
  }
  protected async authorizeUpdate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: allow for admin for non registered objects during boot for CRUD?
    return AuthorizationDecision.DENY;
  }
  protected async authorizeDelete(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: allow for admin for non registered objects during boot for CRUD?
    return AuthorizationDecision.DENY;
  }
}
