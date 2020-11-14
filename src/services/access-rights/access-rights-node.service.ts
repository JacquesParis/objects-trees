import {IRestEntity} from '@jacquesparis/objects-model';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../application.service';
import {ObjectNodeService} from '../object-node.service';
import {AccessRightAbstractService} from './access-rights-abtract.service';
import {AccessRightsScope} from './access-rights.const';
import {
  AccessRightsProvider,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightNodeService
  extends AccessRightAbstractService
  implements AccessRightsProvider {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
    @service(ObjectNodeService)
    protected objectNodeService: ObjectNodeService,
  ) {
    super(accessRightsService, EntityName.objectNode);
  }

  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    return AuthorizationDecision.DENY;
  }
  protected async authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let node: ObjectNode = (null as unknown) as ObjectNode;
    node = await ctx.nodeContext.parent.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0]?.parentNodeId,
      );
    });

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRight(
        AccessRightsScope.create,
        node,
        ctx,
      ))
        ? AuthorizationDecision.ALLOW
        : AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.DENY;
  }
  protected async authorizeUpdate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let node: ObjectNode = (null as unknown) as ObjectNode;
    node = await ctx.nodeContext.node.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0],
      );
    });

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRight(
        AccessRightsScope.update,
        node,
        ctx,
      ))
        ? AuthorizationDecision.ALLOW
        : AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.DENY;
  }
  protected async authorizeDelete(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let node: ObjectNode = (null as unknown) as ObjectNode;
    node = await ctx.nodeContext.node.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0],
      );
    });

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRight(
        AccessRightsScope.delete,
        node,
        ctx,
      ))
        ? AuthorizationDecision.ALLOW
        : AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.DENY;
  }

  public async cleanReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    const objectNode = entity as ObjectNode;
    objectNode.aclCtx = {
      rights: await this.accessRightsService.getNodeAccessRights(
        objectNode,
        ctx,
      ),
    };
  }
}
