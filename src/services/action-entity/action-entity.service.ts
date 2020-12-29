import {IRestEntity} from '@jacquesparis/objects-model';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {BindingScope, injectable, service} from '@loopback/core';
import {indexOf, isFunction, isString} from 'lodash';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {ObjectNodeService} from '../object-node/object-node.service';
import {TreatmentDescription} from './../../integration/extension-description';
import {ObjectTypeService} from './../object-type.service';

export interface ActionEntityInterface {
  providerId: string;
  serviceId: string;
  description: string | (() => TreatmentDescription) | TreatmentDescription;
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
    @service(ObjectTypeService) private objectTypeService: ObjectTypeService,
  ) {}

  getPostTraitmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const entityType in this.actions) {
      for (const methodId in this.actions[entityType]) {
        for (const action of this.actions[entityType][methodId]) {
          if (isString(action.description)) {
            treatments.push(
              new TreatmentDescription(
                action.providerId,
                action.serviceId,
                entityType +
                  '.' +
                  methodId +
                  '(): ' +
                  this.actions[entityType].description,
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

  public registerNewAction(
    entityType: EntityName,
    methodId: string,
    actions: ActionEntityInterface,
  ) {
    if (!this.actions[entityType]) {
      this.actions[entityType] = {};
    }
    if (!this.actions[entityType][methodId]) {
      this.actions[entityType][methodId] = [];
    }
    this.actions[entityType][methodId].push(actions);
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
  ) {
    const objectTypeService = this.objectTypeService;
    this.registerNewAction(
      entityType,
      methodId,
      new (class implements ActionEntityInterface {
        providerId: string;
        serviceId: string;
        description: TreatmentDescription;
        constructor() {
          this.providerId = 'CoreProvider';
          this.serviceId = ActionEntityService.name;
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
        }
        async runAction(
          entity: IRestEntity,
          args: Object,
          ctx: CurrentContext,
        ): Promise<any> {
          const implementedTypes: string[] | undefined = entity.entityCtx
            ?.implementedTypes
            ? entity.entityCtx?.implementedTypes
            : (await objectTypeService.getAll(ctx))[entity.objectTypeId]
                ?.entityCtx?.implementedTypes;
          if (-1 < indexOf(implementedTypes, objectType)) {
            return actionsFunction(entity as T, args, ctx);
          }
        }
      })(),
    );
  }

  public async runAction(
    entityType: EntityName,
    id: string,
    methodId: string,
    args: Object,
    ctx: CurrentContext,
  ): Promise<any> {
    let result;
    if (entityType in this.actions) {
      if (methodId in this.actions[entityType]) {
        switch (entityType) {
          case EntityName.objectNode:
            {
              const nodeObject = await this.objectNodeService.getNode(id, ctx);
              for (const action of this.actions[entityType][methodId]) {
                result = await action.runAction(nodeObject, args, ctx);
              }
            }
            break;
        }
      }
    }
    return result;
  }
}
