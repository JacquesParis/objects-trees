import {IRestEntity} from '@jacquesparis/objects-model';
import {
  AuthorizationContext,
  AuthorizationDecision,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {EntityName} from '../../models/entity-name';
import {ObjectTree} from '../../models/object-tree.model';
import {ObjectNodeService} from '../object-node/object-node.service';
import {ObjectNode} from './../../models/object-node.model';
import {CurrentContext} from './../application.service';
import {ObjectTypeService} from './../object-type.service';
import {AccessRightsAbstractService} from './access-rights-abtract.service';
import {AccessRightsTreeScope} from './access-rights-tree.const';
import {AccessRightsScope, ACCESS_RIGHT_PROVIDER} from './access-rights.const';
import {
  AccessRightsInterface,
  AccessRightsService,
} from './access-rights.service';

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightsTreeService
  extends AccessRightsAbstractService
  implements AccessRightsInterface {
  constructor(
    @service(AccessRightsService)
    protected accessRightsService: AccessRightsService,
    @service(ObjectNodeService)
    protected objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    protected objectTypeService: ObjectTypeService,
  ) {
    super(
      ACCESS_RIGHT_PROVIDER,
      AccessRightsTreeService.name,
      accessRightsService,
      EntityName.objectTree,
    );
  }

  protected async authorizeRead(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision> {
    let treeNode: ObjectNode = (null as unknown) as ObjectNode;
    if (1 < context.scopes.length) {
      switch (context.scopes[1]) {
        case AccessRightsTreeScope.searchOwner:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
            return this.objectNodeService.searchOwner(
              context.invocationContext.args[0],
              context.invocationContext.args[1],
            );
          });
          break;
        case AccessRightsTreeScope.searchNamespace:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
            return this.objectNodeService.searchNamespace(
              context.invocationContext.args[0],
              context.invocationContext.args[1],
              context.invocationContext.args[2],
              context.invocationContext.args[3],
            );
          });
          break;
        case AccessRightsTreeScope.searchTree:
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
            return this.objectNodeService.searchTree(
              context.invocationContext.args[0],
              context.invocationContext.args[1],
              context.invocationContext.args[2],
              context.invocationContext.args[3],
              context.invocationContext.args[4],
              context.invocationContext.args[5],
            );
          });
          break;
        case AccessRightsTreeScope.searchNode:
          {
            const originalTreeNode = await this.objectNodeService.searchTree(
              context.invocationContext.args[0],
              context.invocationContext.args[1],
              context.invocationContext.args[2],
              context.invocationContext.args[3],
              context.invocationContext.args[4],
              context.invocationContext.args[5],
            );
            if (originalTreeNode) {
              const types = await this.objectTypeService.getImplementingTypes(
                context.invocationContext.args[6],
              );
              const treeNodes = await this.objectNodeService.searchByTreeId(
                originalTreeNode.id as string,
                {
                  objectTypeIds: types,
                  name: context.invocationContext.args[7],
                },
              );
              if (treeNodes && 1 === treeNodes.length) {
                treeNode = treeNodes[0];
              }
            }
          }
          break;
      }
    } else {
      treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
        return this.objectNodeService.searchById(
          context.invocationContext.args[0],
        );
      });
    }

    if (treeNode) {
      return (await this.accessRightsService.hasNodeAccessRights(
        AccessRightsScope.read,
        treeNode,
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
    const treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0],
      );
    });

    if (treeNode) {
      return (await this.accessRightsService.hasNodeAccessRights(
        AccessRightsScope.create,
        treeNode,
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
    const treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0],
      );
    });

    if (treeNode) {
      return (await this.accessRightsService.hasNodeAccessRights(
        AccessRightsScope.update,
        treeNode,
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
    const treeNode = await ctx.treeContext.treeNode.getOrSetValue(async () => {
      return this.objectNodeService.searchById(
        context.invocationContext.args[0],
      );
    });

    if (treeNode) {
      return (await this.accessRightsService.hasNodeAccessRights(
        AccessRightsScope.delete,
        treeNode,
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
    const tree = entity as ObjectTree;
    if (!tree.children) {
      tree.children = [];
    }
    await ctx.treeContext.treeChildren.getOrSetValue(async () =>
      tree.children.map((child) => child.treeNode),
    );
    if (!tree.entityCtx) {
      tree.entityCtx = {entityType: EntityName.objectTree};
    }
    tree.entityCtx.aclCtx = {
      rights: await this.accessRightsService.getNodeAccessRights(
        tree.treeNode,
        ctx,
      ),
    };
    if (tree.entityCtx.aclCtx.rights.read) {
      await this.accessRightsService.cleanReturnedEntities(
        EntityName.objectTree,
        tree.children,
        ctx,
      );
    } else {
      tree.children = [];
    }
    await this.accessRightsService.cleanReturnedEntity(
      EntityName.objectNode,
      tree.treeNode,
      ctx,
    );
  }
}
