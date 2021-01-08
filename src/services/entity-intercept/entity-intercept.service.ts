import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
import {isArray, isFunction, isString} from 'lodash';
import {
  ServiceDescripiton,
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

@injectable({scope: BindingScope.SINGLETON})
export class EntityInterceptService
  implements AbstractEntityInterceptorInterface, ServiceDescripiton {
  private entityInterceptors: {
    [resource in EntityName]?: {
      [scope in EntityActionType]?: EntityInterceptorInterface[];
    };
  } = {};

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

  getPreTraitmentDescription(): TreatmentDescription[] {
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
