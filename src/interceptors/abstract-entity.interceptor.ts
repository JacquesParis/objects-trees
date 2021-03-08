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
    // eslint-disable-next-line no-useless-catch
    try {
      //      invocationCtx.targetName = 'ObjectTypeController.prototype.find'
      let result = undefined;

      // Add pre-invocation logic here
      if (
        this.abstractEntityService.interceptRequest &&
        invocationCtx.targetName &&
        invocationCtx.targetName in this.applicationService.entityActions
      ) {
        const entityName: EntityName = this.applicationService.entityActions[
          invocationCtx.targetName
        ].entityName;
        const entityActionType: EntityActionType = this.applicationService
          .entityActions[invocationCtx.targetName].entityActionType;
        let entityId: string | undefined = undefined;
        let entity: IRestEntity | undefined = undefined;
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
            const entityName = this.getEntityName(
              result[0]?.uri,
              uriParts.baseUri,
            );
            if (
              every(result, (oneResult) => {
                return (
                  this.getEntityName(oneResult.uri, uriParts.baseUri) ===
                  entityName
                );
              })
            ) {
              await this.abstractEntityService.completeReturnedEntities(
                entityName,
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
              const entity: RestEntity = oneResult as RestEntity;
              if (entity?.uri) {
                const uriParts = await this.getUriParts(
                  invocationCtx,
                  this.ctx,
                );
                const entityName = this.getEntityName(
                  entity.uri,
                  uriParts.baseUri,
                );

                await this.abstractEntityService.completeReturnedEntity(
                  entityName,
                  oneResult,
                  this.ctx,
                );
              }
            }
          }
        }
      } else if (isObject(result)) {
        const entity: RestEntity = result as RestEntity;
        if (this.abstractEntityService.completeReturnedEntity && entity?.uri) {
          const uriParts = await this.getUriParts(invocationCtx, this.ctx);
          const entityName = this.getEntityName(entity.uri, uriParts.baseUri);

          await this.abstractEntityService.completeReturnedEntity(
            entityName,
            result,
            this.ctx,
          );
        }
      }

      return result;
    } catch (err) {
      throw err;
    }
  }
}
