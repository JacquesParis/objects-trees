import {IRestEntity} from '@jacquesparis/objects-model';
import {
  InvocationContext,
  InvocationResult,
  ValueOrPromise,
} from '@loopback/core';
import {every, isObject} from 'lodash';
import {RestEntity} from '../models';
import {CurrentContext} from '../services/application.service';
import {EntityName} from './../models/entity-name';
import {
  ApplicationService,
  EntityActionType,
} from './../services/application.service';
import {AbstractEntityInterceptorInterface} from './abstract-entity-interceptor.service';
import {AbstractInterceptor} from './abstract.interceptor';

export abstract class AbstractEntityInterceptor<
  T extends AbstractEntityInterceptorInterface
> extends AbstractInterceptor {
  constructor(
    protected abstractEntityService: T,
    protected ctx: CurrentContext,
    protected applicationService: ApplicationService,
  ) {
    super();
  }
  value() {
    return this.intercept.bind(this);
  }
  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ) {
    await this.getUriParts(invocationCtx, this.ctx);
    let entityName: EntityName = (undefined as unknown) as EntityName;
    let entityActionType: EntityActionType = (undefined as unknown) as EntityActionType;
    let entityId: string | undefined = undefined;
    let entity: IRestEntity | undefined = undefined;
    if (
      invocationCtx.targetName &&
      invocationCtx.targetName in this.applicationService.entityActions
    ) {
      entityName = this.applicationService.entityActions[
        invocationCtx.targetName
      ].entityName;
      entityActionType = this.applicationService.entityActions[
        invocationCtx.targetName
      ].entityActionType;
      switch (entityActionType) {
        case EntityActionType.create:
          entity = invocationCtx.args[0];
          break;
        case EntityActionType.update:
          entityId = invocationCtx.args[0];
          entity = invocationCtx.args[1];
          break;
        case EntityActionType.delete:
          entityId = invocationCtx.args[0];
          break;
        case EntityActionType.read:
          entityId = invocationCtx.args[0];
          break;
      }
    }

    // eslint-disable-next-line no-useless-catch
    try {
      //      invocationCtx.targetName = 'ObjectTypeController.prototype.find'
      let result = undefined;

      // Add pre-invocation logic here
      if (
        this.abstractEntityService.interceptRequest &&
        entityName &&
        entityActionType
      ) {
        const interceptionResult = await this.abstractEntityService.interceptRequest(
          entityName,
          entityActionType,
          entityId,
          entity,
          this.ctx,
        );
        if (false === interceptionResult) {
          return;
        }
        if (true !== interceptionResult) {
          result = interceptionResult;
        }
      }
      if (
        undefined === result &&
        this.abstractEntityService.interceptAllRequest
      ) {
        await this.abstractEntityService.interceptAllRequest(this.ctx);
      }
      // invocation
      if (undefined === result) {
        result = await next();
      }
      // Add post-invocation logic here
      if (Array.isArray(result)) {
        if (result.length > 0) {
          let completeDone = false;
          if (
            result[0]?.uri &&
            this.abstractEntityService.completeReturnedEntities
          ) {
            const uriParts = await this.getUriParts(invocationCtx, this.ctx);
            const returnedEntityName = this.getEntityName(
              result[0]?.uri,
              uriParts.baseUri,
            );
            if (
              every(result, (oneResult) => {
                return (
                  this.getEntityName(oneResult.uri, uriParts.baseUri) ===
                  returnedEntityName
                );
              })
            ) {
              await this.abstractEntityService.completeReturnedEntities(
                returnedEntityName,
                result,
                this.ctx,
              );
              completeDone = true;
            }
          }
          if (
            this.abstractEntityService.completeReturnedEntity &&
            !completeDone
          ) {
            for (const oneResult of result) {
              const oneEntity: RestEntity = oneResult as RestEntity;
              if (oneEntity?.uri) {
                const uriParts = await this.getUriParts(
                  invocationCtx,
                  this.ctx,
                );
                const oneEntityName = this.getEntityName(
                  oneEntity.uri,
                  uriParts.baseUri,
                );

                await this.abstractEntityService.completeReturnedEntity(
                  oneEntityName,
                  oneResult,
                  this.ctx,
                );
              }
            }
          }
        }
      } else if (isObject(result)) {
        const returnedEntity: RestEntity = result as RestEntity;
        if (
          this.abstractEntityService.completeReturnedEntity &&
          returnedEntity?.uri
        ) {
          const uriParts = await this.getUriParts(invocationCtx, this.ctx);
          const returnedEntityName = this.getEntityName(
            returnedEntity.uri,
            uriParts.baseUri,
          );

          await this.abstractEntityService.completeReturnedEntity(
            returnedEntityName,
            result,
            this.ctx,
          );
        }
      }

      return result;
    } finally {
      if (
        this.abstractEntityService.makeFinallyTreatment &&
        entityName &&
        entityActionType
      ) {
        await this.abstractEntityService.makeFinallyTreatment(
          entityName,
          entityActionType,
          entityId,
          entity,
          this.ctx,
        );
      }
      if (this.abstractEntityService.makeAllFinallyTreatment) {
        await this.abstractEntityService.makeAllFinallyTreatment(this.ctx);
      }
    }
  }
}
