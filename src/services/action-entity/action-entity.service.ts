import {IRestEntity} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BindingScope,
  injectable,
  InvocationArgs,
  service,
} from '@loopback/core';
import {indexOf, isFunction, isString} from 'lodash';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {ObjectNodeService} from '../object-node/object-node.service';
import {ApplicationError} from './../../helper/application-error';
import {TreatmentDescription} from './../../integration/extension-description';
import {ObjectTreeService} from './../object-tree/object-tree.service';
import {ObjectTypeService} from './../object-type.service';

export interface ActionEntityInterface {
  providerId: string;
  serviceId: string;
  description: string | (() => TreatmentDescription) | TreatmentDescription;
  accessRightsScope: string;
  hasAction(entity: IRestEntity, ctx: CurrentContext): Promise<boolean>;
  runAction(
    entity: IRestEntity,
    args: Object,
    ctx: CurrentContext,
  ): Promise<any>;
}

@injectable({scope: BindingScope.SINGLETON})
export class ActionEntityService {
  actions: {
    [entityType: string]: {[methodId: string]: ActionEntityInterface[]};
  } = {};
  constructor(
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(ObjectTreeService) private objectTreeService: ObjectTreeService,
    @service(ObjectTypeService) private objectTypeService: ObjectTypeService,
  ) {}

  getTraitmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const entityType in this.actions) {
      for (const methodId in this.actions[entityType]) {
        for (const action of this.actions[entityType][methodId]) {
          if (isString(action.description)) {
            treatments.push(
              new TreatmentDescription(
                action.providerId,
                action.serviceId,
                entityType + '.' + methodId + '(): ' + action.description,
              ),
            );
          } else if (isFunction(action.description)) {
            treatments.push(action.description());
          } else {
            treatments.push(action.description);
          }
        }
      }
    }
    return treatments;
  }

  public async getAuthorizationContext(
    entityType: EntityName,
    args: InvocationArgs,
    ctx: CurrentContext,
  ): Promise<string> {
    const action = await this.getAction(entityType, args[0], args[1], ctx);
    if (action) {
      return action.accessRightsScope;
    }
    throw ApplicationError.notImplemented({
      entityType,
      methodId: args[1],
      entityId: args[0],
    });
  }

  public registerNewAction(
    entityType: EntityName,
    methodId: string,
    action: ActionEntityInterface,
  ) {
    if (!this.actions[entityType]) {
      this.actions[entityType] = {};
    }
    if (!this.actions[entityType][methodId]) {
      this.actions[entityType][methodId] = [];
    }
    this.actions[entityType][methodId].push(action);
  }

  public registerNewActionTypeFunction<T extends IRestEntity>(
    functionProviderId: string,
    functionServiceId: string,
    functionDescription: string,
    entityType: EntityName,
    methodId: string,
    objectType: string,
    actionsFunction: (
      entity: T,
      args: Object,
      ctx: CurrentContext,
    ) => Promise<void>,
    functionAccessRightsScope = 'read',
  ) {
    const objectTypeService = this.objectTypeService;
    this.registerNewAction(
      entityType,
      methodId,
      new (class implements ActionEntityInterface {
        providerId: string;
        serviceId: string;
        description: TreatmentDescription;
        accessRightsScope = 'read';
        constructor() {
          this.providerId = functionProviderId;
          this.serviceId = functionServiceId;
          this.description = new TreatmentDescription(
            this.providerId,
            this.serviceId,
            entityType +
              '.' +
              objectType +
              '.' +
              methodId +
              '(): ' +
              functionDescription,
          );
          this.accessRightsScope = functionAccessRightsScope;
        }
        async runAction(
          entity: IRestEntity,
          args: Object,
          ctx: CurrentContext,
        ): Promise<any> {
          if (await this.hasAction(entity, ctx)) {
            return actionsFunction(entity as T, args, ctx);
          }
        }
        async hasAction(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<boolean> {
          const implementedTypes: string[] | undefined = entity.entityCtx
            ?.implementedTypes
            ? entity.entityCtx?.implementedTypes
            : (await objectTypeService.getAll(ctx))[entity.objectTypeId]
                ?.entityCtx?.implementedTypes;
          return -1 < indexOf(implementedTypes, objectType);
        }
      })(),
    );
  }

  public async getEntity<T extends IRestEntity>(
    entityType: EntityName,
    id: string,
    ctx: CurrentContext,
  ): Promise<T> {
    return (await ctx.methodContext.entity.getOrSetValue(async () => {
      let result: IRestEntity = (undefined as unknown) as IRestEntity;
      switch (entityType) {
        case EntityName.objectNode:
          {
            result = await this.objectNodeService.getNode(id, ctx);
          }
          break;
        case EntityName.objectTree: {
          const nodeObject = await this.objectNodeService.getNode(id, ctx);
          ctx.treeContext.treeNode.value = nodeObject;
          const treeNodes = await this.objectTreeService.loadChildrenNodes(
            nodeObject.tree
              ? (nodeObject.id as string)
              : nodeObject.parentTreeId,
            ctx,
          );
          result = await this.objectTreeService.buildTreeFromNodes(
            nodeObject,
            treeNodes,
            ctx,
          );
          break;
        }
      }
      return result;
    })) as T;
  }

  public async getAction(
    entityType: EntityName,
    id: string,
    methodId: string,
    ctx: CurrentContext,
  ) {
    if (entityType in this.actions) {
      if (methodId in this.actions[entityType]) {
        const entity = await this.getEntity(entityType, id, ctx);
        for (const action of this.actions[entityType][methodId]) {
          if (await action.hasAction(entity, ctx)) {
            return action;
          }
        }
      }
    }
    return undefined;
  }

  public async runAction<T extends IRestEntity>(
    entityType: EntityName,
    id: string,
    methodId: string,
    args: Object,
    ctx: CurrentContext,
  ): Promise<T> {
    const action = await this.getAction(entityType, id, methodId, ctx);
    if (!action) {
      throw ApplicationError.notImplemented({
        entityType,
        methodId,
        entityId: id,
      });
    }
    const entity = await this.getEntity(entityType, id, ctx);
    if (!entity) {
      throw ApplicationError.notFound({entityType, entityId: id});
    }

    await action.runAction(entity, args, ctx);
    return this.getEntity<T>(entityType, id, ctx);
  }
}
