import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {indexOf} from 'lodash';
import {TreatmentDescription} from '../../integration/extension-description';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectType} from './../../models/object-type.model';
import {CurrentContext, EntityActionType} from './../application.service';
import {ObjectNodeService} from './../object-node/object-node.service';
import {ObjectTypeService} from './../object-type.service';
import {ENTITY_INTERCEPT_PROVIDER} from './entity-intercept.const';
import {
  EntityInterceptorInterface,
  EntityInterceptService,
} from './entity-intercept.service';

export class NodeInterceptService {
  constructor(
    @service(EntityInterceptService)
    private entityInterceptService: EntityInterceptService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
  ) {}

  private interceptors: {[scope in EntityActionType]?: NodeIntercept} = {};

  public registerEntityInterceptorService(
    functionProviderId: string,
    functionServiceId: string,
    functionDescription: string,
    objectType: string,
    scope: EntityActionType,
    entityInterceptorFunction: (
      entityId: string | undefined,
      entity: ObjectNode,
      requestEntity: Partial<ObjectNode>,
      ctx: CurrentContext,
    ) => Promise<boolean | IRestEntity>,
  ) {
    if (!(scope in this.interceptors)) {
      this.interceptors[scope] = new NodeIntercept(
        this.objectNodeService,
        scope,
        this.entityInterceptService,
        this.objectTypeService,
      );
    }
    if (
      !(objectType in (this.interceptors[scope] as NodeIntercept).interceptors)
    ) {
      (this.interceptors[scope] as NodeIntercept).interceptors[objectType] = [];
    }
    (this.interceptors[scope] as NodeIntercept).interceptors[objectType].push({
      functionDescription,
      functionProviderId,
      functionServiceId,
      entityInterceptorFunction,
    });
  }
}

class NodeIntercept implements EntityInterceptorInterface {
  providerId: string = ENTITY_INTERCEPT_PROVIDER;
  serviceId: string = NodeInterceptService.name;

  constructor(
    private objectNodeService: ObjectNodeService,
    private scope: EntityActionType,
    private entityInterceptService: EntityInterceptService,
    private objectTypeService: ObjectTypeService,
  ) {
    this.entityInterceptService.registerEntityInterceptorService(
      EntityName.objectNode,
      scope,
      this,
    );
  }
  public interceptors: {
    [objectType: string]: {
      functionProviderId: string;
      functionServiceId: string;
      functionDescription: string;
      entityInterceptorFunction: (
        entityId: string | undefined,
        entity: ObjectNode,
        requestEntity: Partial<ObjectNode>,
        ctx: CurrentContext,
      ) => Promise<boolean | IRestEntity>;
    }[];
  } = {};
  description(): TreatmentDescription[] {
    const treatments: TreatmentDescription[] = [];
    for (const objectType in this.interceptors) {
      const interceptors = this.interceptors[objectType] as {
        functionProviderId: string;
        functionServiceId: string;
        functionDescription: string;
        entityInterceptorFunction: (
          entityId: string | undefined,
          entity: IRestEntity | undefined,
          requestEntity: IRestEntity | undefined,
          ctx: CurrentContext,
        ) => Promise<boolean | IRestEntity>;
      }[];
      for (const interceptor of interceptors) {
        treatments.push(
          new TreatmentDescription(
            interceptor.functionProviderId,
            interceptor.functionServiceId,

            objectType +
              '.' +
              this.scope +
              ': ' +
              interceptor.functionDescription,
          ),
        );
      }
    }
    return treatments;
  }
  async interceptRequest(
    entityId: string | undefined,
    entity: IRestEntity | undefined,
    ctx: CurrentContext,
  ): Promise<boolean | IRestEntity> {
    const requestEntity = entity;
    if (entityId) {
      entity = await this.objectNodeService.searchById(entityId);
    }
    const enityObjectType: ObjectType = (
      await this.objectTypeService.getAll(ctx)
    )[(entity as ObjectNode).objectTypeId];
    for (const objectType of Object.keys(this.interceptors)) {
      if (
        objectType === enityObjectType.id ||
        -1 < indexOf(enityObjectType.inheritedTypesIds, objectType)
      ) {
        for (const interceptor of this.interceptors[objectType]) {
          const result = await interceptor.entityInterceptorFunction(
            entityId,
            entity as ObjectNode,
            requestEntity as Partial<ObjectNode>,
            ctx,
          );
          if (false === result) {
            return false;
          }
          if (true !== result) {
            return result;
          }
        }
      }
    }
    return true;
  }
}
