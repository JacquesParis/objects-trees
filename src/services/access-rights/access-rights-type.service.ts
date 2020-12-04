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
import {ObjectTypeService} from './../object-type.service';
import {AccessRightAbstractService} from './access-rights-abtract.service';
import {
  AccessRightsInterface,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightTypeService
  extends AccessRightAbstractService
  implements AccessRightsInterface {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
    @service(ObjectTypeService)
    protected objectTypeService: ObjectTypeService,
  ) {
    super(accessRightsService, EntityName.objectType);
  }

  public async cleanReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const user: ObjectType = entity as ObjectType;

    if (!user.entityCtx) {
      user.entityCtx = {};
    }
    if (!user.entityCtx.aclCtx) {
      user.entityCtx.aclCtx = new AclCtx();
    }
    user.entityCtx.aclCtx.rights.read = true;
    // TODO: check admin and registered objects during boot for CRUD
    user.entityCtx.aclCtx.rights.create =
      ctx.accessRightsContexte.rootRights.value.create;
    user.entityCtx.aclCtx.rights.update =
      !user.applicationType && ctx.accessRightsContexte.rootRights.value.update;
    user.entityCtx.aclCtx.rights.delete =
      !user.applicationType && ctx.accessRightsContexte.rootRights.value.delete;
    // TODO: remove subTypes for non admin;
  }
  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    return AuthorizationDecision.ALLOW;
  }
  protected async authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    return ctx.accessRightsContexte.rootRights.value.create
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
  protected async authorizeUpdate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    return ctx.accessRightsContexte.rootRights.value.update &&
      !(
        await this.objectTypeService.searchById(
          context.invocationContext.args[0],
        )
      ).applicationType
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
  protected async authorizeDelete(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    return ctx.accessRightsContexte.rootRights.value.delete &&
      !(
        await this.objectTypeService.searchById(
          context.invocationContext.args[0],
        )
      ).applicationType
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
}
