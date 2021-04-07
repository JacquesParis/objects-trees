import {IRestEntity} from '@jacquesparis/objects-model';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {isString} from 'lodash';
import {EntityName} from '../../models/entity-name';
import {ObjectNode} from '../../models/object-node.model';
import {CurrentContext} from '../application.service';
import {ObjectNodeService} from '../object-node/object-node.service';
import {AccessRightsAbstractService} from './access-rights-abstract.service';
import {AccessRightsTreeScope} from './access-rights-tree.const';
import {AccessRightsScope, ACCESS_RIGHT_PROVIDER} from './access-rights.const';
import {
  AccessRightsInterface,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightsNodeService
  extends AccessRightsAbstractService
  implements AccessRightsInterface {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
    @service(ObjectNodeService)
    protected objectNodeService: ObjectNodeService,
  ) {
    super(
      ACCESS_RIGHT_PROVIDER,
      AccessRightsNodeService.name,
      accessRightsService,
      EntityName.objectNode,
    );
  }

  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let node: ObjectNode = (null as unknown) as ObjectNode;
    if (1 < context.scopes.length) {
      switch (context.scopes[1]) {
        case AccessRightsTreeScope.searchOwner:
          node = await this.objectNodeService.getOwner(
            context.invocationContext.args[0],
            context.invocationContext.args[1],
            ctx,
          );
          break;
        case AccessRightsTreeScope.searchNamespace:
          node = await this.objectNodeService.getNamespace(
            context.invocationContext.args[0],
            context.invocationContext.args[1],
            context.invocationContext.args[2],
            context.invocationContext.args[3],
            ctx,
          );
          break;
        case AccessRightsTreeScope.searchTree:
          node = await this.objectNodeService.getTree(
            context.invocationContext.args[0],
            context.invocationContext.args[1],
            context.invocationContext.args[2],
            context.invocationContext.args[3],
            context.invocationContext.args[4],
            context.invocationContext.args[5],
            ctx,
          );
          break;
        case AccessRightsTreeScope.searchNode:
          node = await this.objectNodeService.getANodeOfTree(
            context.invocationContext.args[0],
            context.invocationContext.args[1],
            context.invocationContext.args[2],
            context.invocationContext.args[3],
            context.invocationContext.args[4],
            context.invocationContext.args[5],
            context.invocationContext.args[6],
            context.invocationContext.args[7],
            ctx,
          );
          break;
      }
    } else {
      node = await this.objectNodeService.getNode(
        context.invocationContext.args[0],
        ctx,
      );
    }

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRights(
        AccessRightsScope.read,
        node,
        ctx,
      ))
        ? AuthorizationDecision.ALLOW
        : AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.DENY;
  }
  protected async authorizeCreate(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let node: ObjectNode = (null as unknown) as ObjectNode;
    if (isString(context.invocationContext.args[0])) {
      node = await this.objectNodeService.getNode(
        context.invocationContext.args[0],
        ctx,
      );
    } else {
      node = await ctx.nodeContext.parent.getOrSetValue(async () => {
        return this.objectNodeService.searchById(
          context.invocationContext.args[0]?.parentNodeId,
        );
      });
    }

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRights(
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
    const node: ObjectNode = await this.objectNodeService.getNode(
      context.invocationContext.args[0],
      ctx,
    );

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRights(
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
    const node: ObjectNode = await this.objectNodeService.getNode(
      context.invocationContext.args[0],
      ctx,
    );

    if (node) {
      return (await this.accessRightsService.hasNodeAccessRights(
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

    if (!objectNode.entityCtx) {
      objectNode.entityCtx = {entityType: EntityName.objectNode};
    }
    objectNode.entityCtx.aclCtx = {
      rights: await this.accessRightsService.getNodeAccessRights(
        objectNode,
        ctx,
      ),
    };
  }
}
