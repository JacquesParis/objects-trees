import {IRestEntity} from '@jacquesparis/objects-model';
import {BindingScope, injectable, service} from '@loopback/core';
import {indexOf, isFunction, isString} from 'lodash';
import {EntityName, IRestEntityServer} from '../../models';
import {ApplicationService, CurrentContext} from '../application.service';
import {
  ServiceDescription,
  TreatmentDescription,
} from './../../integration/extension-description';
import {AbstractEntityInterceptorInterface} from './../../interceptors/abstract-entity-interceptor.service';
import {TRANSIENT_ENTITY_PROVIDER} from './transient-entity.const';

export interface TransientEntityInterface {
  providerId: string;
  serviceId: string;
  description: string | (() => TreatmentDescription) | TreatmentDescription;
  completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void>;
}

export function onlineDescription(
  description: string | (() => TreatmentDescription) | TreatmentDescription,
): string {
  if (isString(description)) {
    return description;
  }
  if (isFunction(description)) {
    return onlineDescription(description());
  }
  return onlineDescription(description.description);
}

@injectable({scope: BindingScope.SINGLETON})
export class TransientEntityService
  implements AbstractEntityInterceptorInterface, ServiceDescription {
  private transientEntities: {
    [resource in EntityName]?: TransientEntityInterface[];
  } = {};

  public registerTransientEntityService(
    resource: EntityName,
    transientEntity: TransientEntityInterface,
  ) {
    if (!this.transientEntities[resource]) {
      this.transientEntities[resource] = [];
    }
    this.transientEntities[resource]?.push(transientEntity);
  }

  getPostTreatmentDescription(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const resource in this.transientEntities) {
      for (const transientEntity of this.transientEntities[
        resource as EntityName
      ] as TransientEntityInterface[]) {
        if (isString(transientEntity.description)) {
          treatments.push(
            new TreatmentDescription(
              transientEntity.providerId,
              transientEntity.serviceId,
              resource + ': ' + transientEntity.description,
            ),
          );
        } else if (isFunction(transientEntity.description)) {
          treatments.push(transientEntity.description());
        } else {
          treatments.push(transientEntity.description);
        }
      }
    }
    return treatments;
  }

  public registerTransientEntityTypeFunction<T extends IRestEntity>(
    functionProviderId: string,
    functionServiceId: string,
    functionDescription: string,
    resource: EntityName,
    objectType: string,
    transientFunction: (entity: T, ctx: CurrentContext) => Promise<void>,
    methods: ('PUT' | 'POST' | 'PATCH' | 'GET')[] = [],
  ) {
    this.registerTransientEntityService(
      resource,
      new (class implements TransientEntityInterface {
        constructor() {
          this.providerId = functionProviderId;
          this.serviceId = functionServiceId;
          this.description = new TreatmentDescription(
            TRANSIENT_ENTITY_PROVIDER,
            TransientEntityService.name,
            resource + '.' + objectType + ': ' + functionDescription,
          );
          if (0 < methods.length) {
            this.description.description =
              resource +
              '.' +
              objectType +
              '.' +
              methods.join('|') +
              ': ' +
              functionDescription;
          }
        }
        public providerId: string;
        public serviceId: string;
        public description: TreatmentDescription;
        async completeReturnedEntity(
          entity: IRestEntityServer,
          ctx: CurrentContext,
        ): Promise<void> {
          if (0 < methods.length) {
            if (-1 === indexOf(methods, ctx.uriContext?.uri?.value?.method)) {
              return;
            }
          }
          if (-1 < indexOf(entity.entityCtx?.implementedTypes, objectType)) {
            return transientFunction(entity as T, ctx);
          }
        }
      })(),
    );
  }

  get ready(): Promise<void> {
    return this.appCtx.getExtensionContext(TRANSIENT_ENTITY_PROVIDER).ready;
  }

  constructor(
    @service(ApplicationService) protected appCtx: ApplicationService,
  ) {}

  async completeReturnedEntity(
    entityName: EntityName,
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    if (entityName in this.transientEntities) {
      for (const transientEntity of this.transientEntities[
        entityName
      ] as TransientEntityInterface[]) {
        await transientEntity.completeReturnedEntity(entity, ctx);
      }
    }
    if (!entity.entityCtx) {
      entity.entityCtx = {entityType: entityName};
    }
    entity.entityCtx.loaded = true;
  }

  public async completeReturnedEntities(
    entityName: EntityName,
    entities: IRestEntity[],
    ctx: CurrentContext,
  ) {
    for (let childIndex = entities.length - 1; childIndex >= 0; childIndex--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity: any = entities[childIndex];
      await this.completeReturnedEntity(entityName, entity, ctx);
    }
  }
}
