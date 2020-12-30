import {IRestEntity} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
} from '@loopback/authorization';
import {BindingScope, injectable, service} from '@loopback/core';
import {Principal} from '@loopback/security';
import {cloneDeep, some} from 'lodash';
import {ObjectNode} from '../../models';
import {ObjectNodeService} from '../object-node/object-node.service';
import {ApplicationError} from './../../helper/application-error';
import {
  ServiceDescripiton,
  TreatmentDescription,
} from './../../integration/extension-description';
import {EntityName} from './../../models/entity-name';
import {ObjectTree} from './../../models/object-tree.model';
import {ObjectType} from './../../models/object-type.model';
import {ActionEntityService} from './../action-entity/action-entity.service';
import {
  AccessRightsProviderContext,
  ApplicationService,
  CurrentContext,
} from './../application.service';
import {ObjectTreeService} from './../object-tree/object-tree.service';
import {ObjectTypeService} from './../object-type.service';
import {
  AccessRightsCRUD,
  AccessRightsPermission,
  AccessRightsPermissions,
  AccessRightsScope,
  AccessRightsSet,
  ACCESS_RIGHT_PROVIDER,
} from './access-rights.const';

export interface AccessRightsInterface {
  providerId: string;
  serviceId: string;
  cleanReturnedEntity(entity: IRestEntity, ctx: CurrentContext): Promise<void>;
  authorize(
    ctx: CurrentContext,
    context: AuthorizationContext,
  ): Promise<AuthorizationDecision>;
}

@injectable({scope: BindingScope.SINGLETON})
export class AccessRightsService implements ServiceDescripiton {
  private accessRights: {
    [resource in EntityName]?: AccessRightsInterface;
  } = {};

  getPreTraitmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const resource in this.accessRights) {
      treatments.push(
        new TreatmentDescription(
          (this.accessRights[
            resource as EntityName
          ] as AccessRightsInterface).providerId,
          (this.accessRights[
            resource as EntityName
          ] as AccessRightsInterface).serviceId,
          resource + ': Access check',
        ),
      );
    }
    return treatments;
  }
  getPostTraitmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const resource in this.accessRights) {
      treatments.push(
        new TreatmentDescription(
          (this.accessRights[
            resource as EntityName
          ] as AccessRightsInterface).providerId,
          (this.accessRights[
            resource as EntityName
          ] as AccessRightsInterface).serviceId,
          resource + ': Clean',
        ),
      );
    }
    return treatments;
  }

  public registerAccessRightsService(
    resource: EntityName,
    accessRights: AccessRightsInterface,
  ) {
    this.accessRights[resource] = accessRights;
  }

  get ready(): Promise<void> {
    return this.appCtx.getExtensionContext(ACCESS_RIGHT_PROVIDER).ready;
  }
  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
    @service(ObjectTypeService) protected objectTypeService: ObjectTypeService,
    @service(ObjectNodeService) protected objectNodeService: ObjectNodeService,
    @service(ObjectTreeService) protected objectTreeService: ObjectTreeService,
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
  ) {
    /*
    this.init = new AccessRightsInit(
      appCtx,
      objectTypeService,
      objectNodeService,
    );*/
  }

  public async authorize(
    ctx: CurrentContext,
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {
    try {
      await this.ready;
      ctx.accessRightsContext.user.value =
        0 < context.principals.length
          ? context.principals[0]
          : ((null as unknown) as Principal);
      await ctx.accessRightsContext.rootRights.getOrSetValue(async () => {
        return this.calculateRootPermissions(ctx);
      });

      if (metadata?.resource && metadata?.resource in this.accessRights) {
        const accessRights: AccessRightsInterface = this.accessRights[
          metadata.resource as EntityName
        ] as AccessRightsInterface;
        if (metadata.scopes) {
          if (context.scopes) {
            context.scopes = context.scopes.concat(metadata.scopes);
          } else {
            context.scopes = metadata.scopes;
          }
        }
        if (context.scopes && 'method' === context.scopes[0]) {
          context.scopes[0] = await this.actionEntityService.getAuthorizationContext(
            metadata.resource as EntityName,
            context.invocationContext.args,
            ctx,
          );
        }
        return await accessRights.authorize(ctx, context);
      }
    } catch (error) {
      return AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.ALLOW;
  }

  async calculateRootPermissions(
    ctx: CurrentContext,
  ): Promise<AccessRightsSet> {
    const actCtx: AccessRightsProviderContext = this.appCtx.getExtensionContext<
      AccessRightsProviderContext
    >(ACCESS_RIGHT_PROVIDER);
    if (!ctx.accessRightsContext?.user?.value?.id) {
      return new AccessRightsSet();
    }
    const rootRights = (
      await this.computeACLTree(
        await this.objectTreeService.loadTree(
          actCtx.nodes.rootACL.value.id as string,
          CurrentContext.get({treeContext: {treeNode: actCtx.nodes.rootACL}}),
        ),
        ctx.accessRightsContext.user.value,
      )
    ).rights;
    return rootRights;
  }

  public async cleanReturnedEntity(
    entityName: EntityName,
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    if (entityName in this.accessRights) {
      const accessRights: AccessRightsInterface = this.accessRights[
        entityName
      ] as AccessRightsInterface;
      await accessRights.cleanReturnedEntity(entity, ctx);
    } else {
      throw ApplicationError.forbiden();
    }
  }

  public async cleanReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
  ) {
    if (entityName in this.accessRights) {
      for (
        let childIndex = entities.length - 1;
        childIndex >= 0;
        childIndex--
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entity: IRestEntity = entities[childIndex];
        await this.cleanReturnedEntity(entityName, entity, ctx);
        if (entity.entityCtx?.aclCtx && !entity.entityCtx.aclCtx.rights.read) {
          entities.splice(childIndex, 1);
        }
      }
    }
  }

  public async getNodeAccessRights(
    node: ObjectNode,
    ctx: CurrentContext,
  ): Promise<AccessRightsCRUD> {
    // TODO : disable update for object created during boot ?
    try {
      const rights = await ctx.accessRightsContext.rights.waitForValue;
      // if node is just the root of the acl tree
      if (node.id === ctx.accessRightsContext.treeRootNodeId.value) {
        return rights.treeRootNode.toAccessRightsCRUD();
      }
      // if owner => true
      if (rights.treeChildrenNodes.owner) {
        return new AccessRightsCRUD(true, true, true, true);
      }
      //Check if node is not in last def tree ACLDef
      //  => rights.treeChildrenNodes[scope]
      const aclTrees = await ctx.accessRightsContext.aclTrees.waitForValue;
      if (
        !(node.parentACLId in aclTrees) ||
        !this.objectTreeService.isInTree(aclTrees[node.parentACLId], node)
      ) {
        return rights.treeChildrenNodes.toAccessRightsCRUD();
      }
      // if not acl => false (as the node is part of ACL)
      if (!rights.treeChildrenNodes.access) {
        return new AccessRightsCRUD(false, false, false, false);
      }
      // If Node = aclDef => read, write, create
      if (
        node.objectTypeId ===
        (await this.appCtx.accessRightsDefinitionType.waitForValue).id
      ) {
        return new AccessRightsCRUD(true, true, false, true);
      }
      // If Node = Owners or children  => false
      const owners: ObjectTree = this.objectTreeService.getChildOfType(
        aclTrees[node.parentACLId],
        (await this.appCtx.accessRightsOwnersType.waitForValue).id as string,
      );
      if (owners && this.objectTreeService.isInTree(owners, node)) {
        return new AccessRightsCRUD(false, false, false, false);
      }
      // If Node = Managers or children => just read
      const managers: ObjectTree = this.objectTreeService.getChildOfType(
        aclTrees[node.parentACLId],
        (await this.appCtx.accessRightsAccessManagersType.waitForValue)
          .id as string,
      );
      if (managers && this.objectTreeService.isInTree(managers, node)) {
        return new AccessRightsCRUD(false, true, false, false);
      }
      // Else (acl and access right groups) => true
      return new AccessRightsCRUD(true, true, true, true);
    } catch (error) {
      return new AccessRightsCRUD(false, false, false, false);
    }
  }

  public async hasNodeAccessRights(
    scope: AccessRightsScope,
    node: ObjectNode,
    ctx: CurrentContext,
  ): Promise<boolean> {
    await this.loadRights(node, ctx);
    const rights: {
      [scope in AccessRightsScope]?: boolean;
    } = await this.getNodeAccessRights(node, ctx);
    return !!rights[scope];
  }

  private async loadACLTrees(
    acl: string[],
    ctx: CurrentContext,
  ): Promise<{[aclId: string]: ObjectTree}> {
    return ctx.accessRightsContext.aclTrees.getOrSetValue(async () => {
      const aclType: ObjectType = await this.appCtx.accessRightsDefinitionType
        .waitForValue;
      const aclRoots: ObjectNode[] = await this.objectNodeService.searchByParentIdsAndObjectTypeId(
        acl,
        aclType.id as string,
      );
      const aclNodes: ObjectNode[] = await this.objectNodeService.searchByTreeIds(
        aclRoots.map((aclRoot) => aclRoot.id as string),
      );
      const aclTrees: {[aclId: string]: ObjectTree} = {};
      for (const aclRoot of aclRoots) {
        aclTrees[
          aclRoot.parentNodeId
        ] = await this.objectTreeService.buildTreeFromNodes(
          aclRoot,
          aclNodes,
          ctx,
        );
      }
      return aclTrees;
    });
  }

  public async loadRights(node: ObjectNode, ctx: CurrentContext) {
    return ctx.accessRightsContext.rights.getOrSetValue(async () => {
      const rights: AccessRightsPermissions = new AccessRightsPermissions();

      try {
        const acl: string[] = node.aclList ? cloneDeep(node.aclList) : [];
        if (node.acl) {
          acl.push(node.id as string);
        }
        if (0 === acl.length) {
          ctx.accessRightsContext.treeRootNodeId.value = (null as unknown) as string;
          return rights;
        }
        ctx.accessRightsContext.treeRootNodeId.value = acl[acl.length - 1];

        const aclTrees: {[aclId: string]: ObjectTree} = await this.loadACLTrees(
          acl,
          ctx,
        );

        const reset: AccessRightsPermissions = new AccessRightsPermissions();
        if (node.id === acl[acl.length - 1] && node.id in aclTrees) {
          const nodeRightSet: {
            reset: AccessRightsSet;
            rights: AccessRightsSet;
          } = await this.computeACLTree(
            aclTrees[acl.pop() as string],
            ctx.accessRightsContext.user.value,
          );
          reset.treeChildrenNodes = nodeRightSet.reset;
          rights.treeChildrenNodes = nodeRightSet.rights;
          rights.treeRootNode.read =
            rights.treeRootNode.read || rights.treeChildrenNodes.read;
          rights.treeRootNode.create =
            rights.treeRootNode.create || rights.treeChildrenNodes.create;
        }
        let aclId = acl.pop();
        while (
          aclId &&
          some(
            Object.keys(reset.treeChildrenNodes),
            (key) =>
              false === reset.treeRootNode[key as AccessRightsPermission],
          ) &&
          some(
            Object.keys(rights.treeChildrenNodes),
            (key) =>
              false === reset.treeRootNode[key as AccessRightsPermission],
          )
        ) {
          if (aclId in aclTrees) {
            const nodeRightSet: {
              reset: AccessRightsSet;
              rights: AccessRightsSet;
            } = await this.computeACLTree(
              aclTrees[aclId],
              ctx.accessRightsContext.user.value,
            );
            this.mergeRight(
              reset.treeChildrenNodes,
              rights.treeChildrenNodes,
              nodeRightSet.rights,
            );
            this.mergeReset(reset.treeChildrenNodes, nodeRightSet.reset);
            this.mergeRight(
              reset.treeRootNode,
              rights.treeRootNode,
              nodeRightSet.rights,
            );
            this.mergeReset(reset.treeRootNode, nodeRightSet.reset);
          }
          aclId = acl.pop();
        }
        // eslint-disable-next-line no-empty
      } catch (error) {}
      return rights;
    });
  }

  private mergeReset(
    actualResets: AccessRightsSet,
    addedResets: AccessRightsSet,
  ) {
    for (const permission in actualResets) {
      actualResets[permission as AccessRightsPermission] =
        actualResets[permission as AccessRightsPermission] ||
        addedResets[permission as AccessRightsPermission];
    }
  }
  private mergeRight(
    resetedRights: AccessRightsSet,
    actualRights: AccessRightsSet,
    addedRights: AccessRightsSet,
  ) {
    for (const right in resetedRights) {
      for (const permission in resetedRights) {
        if (!resetedRights[permission as AccessRightsPermission]) {
          actualRights[permission as AccessRightsPermission] =
            actualRights[permission as AccessRightsPermission] ||
            addedRights[permission as AccessRightsPermission];
        }
      }
    }
  }

  protected async computeACLTree(
    aclTree: ObjectTree,
    principal: Principal,
  ): Promise<{reset: AccessRightsSet; rights: AccessRightsSet}> {
    const computedTree: {reset: AccessRightsSet; rights: AccessRightsSet} = {
      reset: new AccessRightsSet(),
      rights: new AccessRightsSet(),
    };
    computedTree.reset.create = !!aclTree.treeNode.resetCreate;
    computedTree.reset.read = !!aclTree.treeNode.resetRead;
    computedTree.reset.update = !!aclTree.treeNode.resetUpdate;
    computedTree.reset.delete = !!aclTree.treeNode.resetDelete;

    const aclTreeSubTypes = aclTree.childrenByObjectTypeId;

    const ownersTypeId: string = this.appCtx.accessRightsOwnersType.value
      .id as string;
    if (ownersTypeId in aclTreeSubTypes) {
      const owners: ObjectTree = aclTreeSubTypes[ownersTypeId][0];
      computedTree.reset.owner = !!owners.treeNode.resetOwner;
      if (this.findMatchingUser(owners.children, principal)) {
        computedTree.rights.owner = true;
        computedTree.rights.access = true;
        computedTree.rights.create = true;
        computedTree.rights.read = true;
        computedTree.rights.update = true;
        computedTree.rights.delete = true;
      }
    }

    const accessRightsAccessManagersId: string = this.appCtx
      .accessRightsAccessManagersType.value.id as string;
    if (accessRightsAccessManagersId in aclTreeSubTypes) {
      const accessRightsAccessManagers: ObjectTree =
        aclTreeSubTypes[accessRightsAccessManagersId][0];
      computedTree.reset.access = !!accessRightsAccessManagers.treeNode
        .resetAccess;
      if (
        !computedTree.rights.access &&
        this.findMatchingUser(accessRightsAccessManagers.children, principal)
      ) {
        computedTree.rights.access = true;
        computedTree.rights.create = true;
        computedTree.rights.read = true;
        computedTree.rights.update = true;
        computedTree.rights.delete = true;
      }
    }

    if (
      !(
        computedTree.rights.create &&
        computedTree.rights.read &&
        computedTree.rights.update &&
        computedTree.rights.delete
      )
    ) {
      const groupTypeId: string = this.appCtx.accessRightsGroupType.value
        .id as string;
      if (groupTypeId in aclTreeSubTypes) {
        for (const group of aclTreeSubTypes[groupTypeId]) {
          if (
            computedTree.rights.create &&
            computedTree.rights.read &&
            computedTree.rights.update &&
            computedTree.rights.delete
          ) {
            break;
          }
          if (
            (!group.treeNode.grantCreate || computedTree.rights.create) &&
            (!group.treeNode.grantRead || computedTree.rights.read) &&
            (!group.treeNode.grantUpdate || computedTree.rights.update) &&
            (!group.treeNode.grantDelete || computedTree.rights.delete)
          ) {
            continue;
          }
          if (this.findMatchingUser(group.children, principal)) {
            computedTree.rights.create =
              computedTree.rights.create || group.treeNode.grantCreate;
            computedTree.rights.read =
              computedTree.rights.read || group.treeNode.grantRead;
            computedTree.rights.update =
              computedTree.rights.update || group.treeNode.grantUpdate;
            computedTree.rights.delete =
              computedTree.rights.delete || group.treeNode.grantDelete;
          }
        }
      }
      computedTree.rights.read =
        computedTree.rights.read ||
        computedTree.rights.create ||
        computedTree.rights.update ||
        computedTree.rights.delete;
    }

    return computedTree;
  }

  private findMatchingUser(users: ObjectTree[], principal: Principal) {
    return some(users, (user) => {
      switch (user.treeNode.objectTypeId) {
        case this.appCtx.userType.value.id:
          return user.treeNode.contentUserId === principal.id;
        case this.appCtx.anonymousUserType.value.id:
          return true;
      }
    });
  }
}
