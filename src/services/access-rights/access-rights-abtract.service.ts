import {IRestEntity} from '@jacquesparis/objects-model';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {AccessRightsScope} from './access-rights.const';
import {
  AccessRightsProvider,
  AccessRightsService,
} from './access-rights.service';

export abstract class AccessRightAbstractService
  implements AccessRightsProvider {
  constructor(
    protected accessRightsService: AccessRightsService,
    protected resource: EntityName,
  ) {
    this.accessRightsService.registerAccessRightsService(resource, this);
  }
  public abstract cleanReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void>;
  protected abstract authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision>;
  protected abstract authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision>;
  protected abstract authorizeUpdate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision>;
  protected abstract authorizeDelete(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision>;

  public async authorize(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    if (0 < context.scopes?.length) {
      switch (context.scopes[0]) {
        case AccessRightsScope.create:
          return this.authorizeCreate(ctx, context);
        case AccessRightsScope.read:
          return this.authorizeRead(ctx, context);
        case AccessRightsScope.update:
          return this.authorizeUpdate(ctx, context);
        case AccessRightsScope.delete:
          return this.authorizeDelete(ctx, context);
      }
    }
    return AuthorizationDecision.DENY;
  }
}
