import {IRestEntity} from '@jacquesparis/objects-model';
import {User} from '@loopback/authentication-jwt';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {RestEntity} from '../../models';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {AclCtx} from './../../models/acl-ctx.model';
import {AccessRightAbstractService} from './access-rights-abtract.service';
import {
  AccessRightsProvider,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightUserService
  extends AccessRightAbstractService
  implements AccessRightsProvider {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
  ) {
    super(accessRightsService, EntityName.user);
  }

  public async cleanReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const user: User & RestEntity = entity as User & RestEntity;
    if (!user?.aclCtx) {
      user.aclCtx = new AclCtx();
    }
    user.aclCtx.rights.read = true;
    // TODO: clean the object here;
  }
  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: check if reading Me
    return AuthorizationDecision.ALLOW;
  }
  protected async authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: check if not login and is user creation
    return AuthorizationDecision.ALLOW;
  }
  protected async authorizeUpdate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: check if updating Me
    return AuthorizationDecision.DENY;
  }
  protected async authorizeDelete(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    // TODO: check if deleting Me
    return AuthorizationDecision.DENY;
  }
}
