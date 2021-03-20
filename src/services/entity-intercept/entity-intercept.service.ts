import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
import {isArray, isFunction, isString} from 'lodash';
import {
  ServiceDescription,
  TreatmentDescription,
} from '../../integration/extension-description';
import {AbstractEntityInterceptorInterface} from '../../interceptors/abstract-entity-interceptor.service';
import {EntityName} from '../../models';
import {ApplicationService, EntityActionType} from '../application.service';
import {CurrentContext} from './../application.service';

export interface EntityInterceptorInterface {
  providerId: string;
  serviceId: string;
  description:
    | string
    | (() => TreatmentDescription)
    | (() => TreatmentDescription[])
    | TreatmentDescription;
  interceptRequest(
    entityId: string | undefined,
    entity: IRestEntity | undefined,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity>;
}
export interface AllInterceptorInterface {
  providerId: string;
  serviceId: string;
  description:
    | string
    | (() => TreatmentDescription)
    | (() => TreatmentDescription[])
    | TreatmentDescription;
  interceptRequest(ctx: CurrentContext): Promise<void>;
}
export interface EntityFinallyInterface {
  providerId: string;
  serviceId: string;
  description:
    | string
    | (() => TreatmentDescription)
    | (() => TreatmentDescription[])
    | TreatmentDescription;
  finallyRequest(
    entityId: string | undefined,
    entity: IRestEntity | undefined,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity>;
}
export interface AllFinallyInterface {
  providerId: string;
  serviceId: string;
  description:
    | string
    | (() => TreatmentDescription)
    | (() => TreatmentDescription[])
    | TreatmentDescription;
  finallyRequest(ctx: CurrentContext): Promise<void>;
}

@injectable({scope: BindingScope.SINGLETON})
export class EntityInterceptService
  implements AbstractEntityInterceptorInterface, ServiceDescription {
  private entityInterceptors: {
    [resource in EntityName]?: {
      [scope in EntityActionType]?: EntityInterceptorInterface[];
    };
  } = {};
  private allInterceptors: AllInterceptorInterface[] = [];
  private finallyInterceptors: {
    [resource in EntityName]?: {
      [scope in EntityActionType]?: EntityFinallyInterface[];
    };
  } = {};
  private allFinalTreatments: AllFinallyInterface[] = [];

  public registerEntityInterceptorService(
    resource: EntityName,
    scope: EntityActionType,
    entityInterceptor: EntityInterceptorInterface,
  ) {
    if (!(resource in this.entityInterceptors)) {
      this.entityInterceptors[resource] = {};
    }
    if (!(scope in (this.entityInterceptors[resource] as Object))) {
      (this.entityInterceptors[resource] as {
        [scope in EntityActionType]?: EntityInterceptorInterface[];
      })[scope] = [];
    }
    (this.entityInterceptors[resource] as {
      [scope in EntityActionType]?: EntityInterceptorInterface[];
    })[scope]?.push(entityInterceptor);
  }
  public registerAllInterceptorService(
    allInterceptor: AllInterceptorInterface,
  ) {
    this.allInterceptors.push(allInterceptor);
  }

  public registerFinallyInterceptorService(
    resource: EntityName,
    scope: EntityActionType,
    finallyInterceptor: EntityFinallyInterface,
  ) {
    if (!(resource in this.finallyInterceptors)) {
      this.finallyInterceptors[resource] = {};
    }
    if (!(scope in (this.finallyInterceptors[resource] as Object))) {
      (this.finallyInterceptors[resource] as {
        [scope in EntityActionType]?: EntityInterceptorInterface[];
      })[scope] = [];
    }
    (this.finallyInterceptors[resource] as {
      [scope in EntityActionType]?: EntityFinallyInterface[];
    })[scope]?.push(finallyInterceptor);
  }
  public registerAllFinalTreatmentService(
    allFinalTreatment: AllFinallyInterface,
  ) {
    this.allFinalTreatments.push(allFinalTreatment);
  }

  public async interceptRequest(
    entityName: EntityName,
    scope: EntityActionType,
    entityId: string | undefined,
    entity: IRestEntity | undefined,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity> {
    if (
      entityName in this.entityInterceptors &&
      scope in
        (this.entityInterceptors[entityName] as {
          [scope in EntityActionType]?: EntityInterceptorInterface[];
        })
    ) {
      for (const interceptor of (this.entityInterceptors[entityName] as {
        [action in EntityActionType]: EntityInterceptorInterface[];
      })[scope]) {
        const result = await interceptor.interceptRequest(
          entityId,
          entity,
          ctx,
        );
        if (result === false) {
          return false;
        }
        if (result !== true) {
          return result;
        }
      }
    }
    return true;
  }
  public async interceptAllRequest(ctx: CurrentContext): Promise<void> {
    for (const intercept of this.allInterceptors) {
      await intercept.interceptRequest(ctx);
    }
  }

  public async makeFinallyTreatment(
    entityName: EntityName,
    scope: EntityActionType,
    entityId: string | undefined,
    entity: IRestEntity | undefined,
    ctx: CurrentContext,
  ): Promise<void> {
    if (
      entityName in this.finallyInterceptors &&
      scope in
        (this.finallyInterceptors[entityName] as {
          [scope in EntityActionType]?: EntityFinallyInterface[];
        })
    ) {
      for (const finallyTreatment of (this.finallyInterceptors[entityName] as {
        [action in EntityActionType]: EntityFinallyInterface[];
      })[scope]) {
        await finallyTreatment.finallyRequest(entityId, entity, ctx);
      }
    }
    return;
  }
  public async makeAllFinallyTreatment(ctx: CurrentContext): Promise<void> {
    for (const intercept of this.allFinalTreatments) {
      await intercept.finallyRequest(ctx);
    }
  }

  getPreTreatmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const resource in this.entityInterceptors) {
      for (const scope in this.entityInterceptors[resource as EntityName]) {
        for (const interceptor of (this.entityInterceptors[
          resource as EntityName
        ] as {
          [scope in EntityActionType]: EntityInterceptorInterface[];
        })[scope as EntityActionType]) {
          if (isString(interceptor.description)) {
            treatments.push(
              new TreatmentDescription(
                interceptor.providerId,
                interceptor.serviceId,
                resource + ': ' + interceptor.description,
              ),
            );
          } else if (isFunction(interceptor.description)) {
            const desc = interceptor.description();
            if (isArray(desc)) {
              treatments.push(...desc);
            } else {
              treatments.push(desc);
            }
          } else {
            treatments.push(interceptor.description);
          }
        }
      }
    }
    return treatments;
  }

  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
  ) {}
}
