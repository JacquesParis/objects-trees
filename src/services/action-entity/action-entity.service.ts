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

export interface GeneratedViewInterface {
  type: 'file' | 'base64' | 'json' | 'text';
  file?: {
    filePath: string;
    fileName: string;
  };
  base64?: {
    name: string;
    base64: string;
    type?: string;
  };
  json?: Object;
  text?: {response: string; contentType?: string};
}
export interface MethodAndViewEntityInterface {
  providerId: string;
  serviceId: string;
  description: string | (() => TreatmentDescription) | TreatmentDescription;
  accessRightsScope: string;
  hasMethod?(entity: IRestEntity, ctx: CurrentContext): Promise<boolean>;
  hasView?(entity: IRestEntity, ctx: CurrentContext): Promise<boolean>;
  runMethod?(
    entity: IRestEntity,
    args: Object,
    ctx: CurrentContext,
  ): Promise<any>;
  generateView?(
    entity: IRestEntity,
    args: {0?: string; 1?: string; 2?: string},
    ctx: CurrentContext,
  ): Promise<any>;
}

@injectable({scope: BindingScope.SINGLETON})
export class ActionEntityService {
  methodsAndViews: {
    [entityType: string]: {
      [methodOrViewId: string]: MethodAndViewEntityInterface[];
    };
  } = {};
  constructor(
    @service(ObjectNodeService) private objectNodeService: ObjectNodeService,
    @service(ObjectTreeService) private objectTreeService: ObjectTreeService,
    @service(ObjectTypeService) private objectTypeService: ObjectTypeService,
  ) {}

  getTraitmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const entityType in this.methodsAndViews) {
      for (const methodOrViewId in this.methodsAndViews[entityType]) {
        for (const methodOrView of this.methodsAndViews[entityType][
          methodOrViewId
        ]) {
          if (isString(methodOrView.description)) {
            treatments.push(
              new TreatmentDescription(
                methodOrView.providerId,
                methodOrView.serviceId,
                entityType +
                  '.' +
                  methodOrViewId +
                  '(): ' +
                  methodOrView.description,
              ),
            );
          } else if (isFunction(methodOrView.description)) {
            treatments.push(methodOrView.description());
          } else {
            treatments.push(methodOrView.description);
          }
        }
      }
    }
    return treatments;
  }

  public async getMethodAuthorizationContext(
    entityType: EntityName,
    args: InvocationArgs,
    ctx: CurrentContext,
  ): Promise<string> {
    const method = await this.getMethod(entityType, args[0], args[1], ctx);
    if (method) {
      return method.accessRightsScope;
    }
    throw ApplicationError.notImplemented({
      entityType,
      methodId: args[1],
      entityId: args[0],
    });
  }

  public async getViewAuthorizationContext(
    entityType: EntityName,
    args: InvocationArgs,
    ctx: CurrentContext,
  ): Promise<string> {
    const view = await this.getView(entityType, args[0], args[1], ctx);
    if (view) {
      return view.accessRightsScope;
    }
    throw ApplicationError.notImplemented({
      entityType,
      viewId: args[1],
      entityId: args[0],
    });
  }

  public registerNewMethodOrView(
    entityType: EntityName,
    methodOrViewId: string,
    methodOrView: MethodAndViewEntityInterface,
  ) {
    if (!this.methodsAndViews[entityType]) {
      this.methodsAndViews[entityType] = {};
    }
    if (!this.methodsAndViews[entityType][methodOrViewId]) {
      this.methodsAndViews[entityType][methodOrViewId] = [];
    }
    this.methodsAndViews[entityType][methodOrViewId].push(methodOrView);
  }

  public registerNewMethodFunction<T extends IRestEntity>(
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
    this.registerNewMethodOrView(
      entityType,
      methodId,
      new (class implements MethodAndViewEntityInterface {
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
        async runMethod(
          entity: IRestEntity,
          args: Object,
          ctx: CurrentContext,
        ): Promise<any> {
          if (await this.hasMethod(entity, ctx)) {
            return actionsFunction(entity as T, args, ctx);
          }
        }
        async generateView(
          entity: IRestEntity,
          args: {0?: string; 1?: string; 2?: string},
          ctx: CurrentContext,
        ): Promise<any> {}
        async hasMethod(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<boolean> {
          const objectTypeId =
            EntityName.objectTree === entityType
              ? entity.treeNode?.objectTypeId
              : entity.objectTypeId;

          const implementedTypes: string[] = await objectTypeService.getImplementedTypes(
            objectTypeId,
          );

          return -1 < indexOf(implementedTypes, objectType);
        }
        async hasView(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<boolean> {
          return false;
        }
      })(),
    );
  }

  public registerNewViewFunction<T extends IRestEntity>(
    functionProviderId: string,
    functionServiceId: string,
    functionDescription: string,
    entityType: EntityName,
    methodId: string,
    objectType: string,
    viewFunction: (
      entity: T,
      args: {0?: string; 1?: string; 2?: string},
      ctx: CurrentContext,
    ) => Promise<GeneratedViewInterface>,
    functionAccessRightsScope = 'read',
  ) {
    const objectTypeService = this.objectTypeService;
    this.registerNewMethodOrView(
      entityType,
      methodId,
      new (class implements MethodAndViewEntityInterface {
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
        async runMethod(
          entity: IRestEntity,
          args: Object,
          ctx: CurrentContext,
        ): Promise<any> {}
        async generateView(
          entity: IRestEntity,
          args: {0?: string; 1?: string; 2?: string},
          ctx: CurrentContext,
        ): Promise<any> {
          if (await this.hasView(entity, ctx)) {
            return viewFunction(entity as T, args, ctx);
          }
        }
        async hasMethod(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<boolean> {
          return false;
        }
        async hasView(
          entity: IRestEntity,
          ctx: CurrentContext,
        ): Promise<boolean> {
          const objectTypeId =
            EntityName.objectTree === entityType
              ? entity.treeNode?.objectTypeId
              : entity.objectTypeId;

          const implementedTypes: string[] = await objectTypeService.getImplementedTypes(
            objectTypeId,
          );

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

  public async getMethod(
    entityType: EntityName,
    id: string,
    methodId: string,
    ctx: CurrentContext,
  ): Promise<MethodAndViewEntityInterface | undefined> {
    if (entityType in this.methodsAndViews) {
      if (methodId in this.methodsAndViews[entityType]) {
        const entity = await this.getEntity(entityType, id, ctx);
        for (const method of this.methodsAndViews[entityType][methodId]) {
          if (method.hasMethod && (await method.hasMethod(entity, ctx))) {
            return method;
          }
        }
      }
    }
    return undefined;
  }
  public async getView(
    entityType: EntityName,
    id: string,
    viewId: string,
    ctx: CurrentContext,
  ): Promise<MethodAndViewEntityInterface | undefined> {
    if (entityType in this.methodsAndViews) {
      if (viewId in this.methodsAndViews[entityType]) {
        const entity = await this.getEntity(entityType, id, ctx);
        for (const view of this.methodsAndViews[entityType][viewId]) {
          if (view.hasView && (await view.hasView(entity, ctx))) {
            return view;
          }
        }
      }
    }
    return undefined;
  }

  public async runMethod<T extends IRestEntity>(
    entityType: EntityName,
    id: string,
    methodId: string,
    args: Object,
    ctx: CurrentContext,
  ): Promise<T> {
    const method = await this.getMethod(entityType, id, methodId, ctx);
    if (!method) {
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

    if (method.runMethod) {
      await method.runMethod(entity, args, ctx);
    }
    return this.getEntity<T>(entityType, id, ctx);
  }

  public async generateView(
    entityType: EntityName,
    id: string,
    viewId: string,
    args: {[0]?: string; [1]?: string; [2]?: string},
    ctx: CurrentContext,
  ): Promise<GeneratedViewInterface> {
    const view = await this.getView(entityType, id, viewId, ctx);
    if (!view) {
      throw ApplicationError.notImplemented({
        entityType,
        viewId: viewId,
        entityId: id,
      });
    }
    const entity = await this.getEntity(entityType, id, ctx);
    if (!entity) {
      throw ApplicationError.notFound({entityType, entityId: id});
    }
    if (view.generateView) {
      return view.generateView(entity, args, ctx);
    }
    throw ApplicationError.notImplemented({
      entityType,
      viewId: viewId,
      entityId: id,
    });
  }
}
