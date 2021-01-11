import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {indexOf, isArray, isObject, isString} from 'lodash';
import {EntityName} from '../../models/entity-name';
import {CurrentContext} from '../application.service';
import {
  TransientEntityInterface,
  TransientEntityService,
} from '../transient-entity/transient-entity.service';
import {InsideRestService} from './inside-rest.service';
import {TRANSIENT_URI_PROVIDER} from './transient-uri-reference.const';
export class TransientUriReferenceService implements TransientEntityInterface {
  providerId: string = TRANSIENT_URI_PROVIDER;
  serviceId: string = TransientUriReferenceService.name;
  description =
    'Add references to ObjectTree, ObjectNode and ObjectType entities when they are referenced by an Uri field ended respectivly by ObjectTreeUri, ObjectNodeUri or ObjectTypeUri';
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(InsideRestService)
    private insideRestService: InsideRestService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectNode,
      this,
    );
  }

  private isUriObjectReference(key: string, ctx: CurrentContext) {
    return (
      key.endsWith('ObjectTreeUri') ||
      key.endsWith('ObjectNodeUri') ||
      key.endsWith('ObjectTypeUri')
    );
  }
  private getObjectReferenceAttributeName(key: string, ctx: CurrentContext) {
    return key
      .replace('ObjectTreeUri', 'Tree')
      .replace('ObjectNodeUri', 'Node')
      .replace('ObjectTypeUri', 'Type');
  }

  private isExcludedKey(key: string, ctx: CurrentContext) {
    return -1 < indexOf(['aclList', 'entityCtx'], key);
  }

  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    for (const key in entity) {
      if (
        key.endsWith('Uri') &&
        entity[key] &&
        isString(entity[key]) &&
        this.isUriObjectReference(key, ctx)
      ) {
        const uri = entity[key];
        const defaultAttribute = key.substr(0, key.length - 3);
        const newAttribute = this.getObjectReferenceAttributeName(key, ctx);
        let ref: IRestEntity | undefined = undefined;
        let insertRef = false;
        if (undefined !== entity[defaultAttribute]) {
          ref = entity[defaultAttribute];
        } else {
          try {
            ref = await this.insideRestService.read(uri, ctx);
            if (
              EntityName.objectTree === ref.entityCtx?.entityType &&
              isObject(ctx.uriContext?.returnedEntity?.value) &&
              !isArray(ctx.uriContext?.returnedEntity?.value) &&
              EntityName.objectTree ===
                ctx.uriContext?.returnedEntity?.value?.entityCtx?.entityType &&
              !ref.aliasUri &&
              ref.treeNode &&
              ref.treeNode.parentTreeId ===
                ctx.uriContext.returnedEntity.value.treeNode.id
            ) {
              insertRef = false;
            } else if (
              EntityName.objectTree === ref.entityCtx?.entityType &&
              isObject(ctx.uriContext?.returnedEntity?.value) &&
              !isArray(ctx.uriContext?.returnedEntity?.value) &&
              EntityName.objectNode ===
                ctx.uriContext?.returnedEntity?.value?.entityCtx?.entityType &&
              !ref.aliasUri && // parent of a new tree, not loaded
              ref.treeNode &&
              ref.treeNode.parentTreeId ===
                ctx.uriContext.returnedEntity.value.parentTreeId
            ) {
              insertRef = false;
            } else {
              insertRef = true;
            }
            // eslint-disable-next-line no-empty
          } catch (error) {}
          if (ref?.id && ref.uri) {
            entity[newAttribute + 'Id'] = ref.id;
            entity[newAttribute + 'Uri'] = ref.uri;
            if (insertRef) {
              entity[newAttribute] = ref;
            }
          }
        }
      }
      if (!this.isExcludedKey(key, ctx)) {
        if (isArray(entity[key])) {
          for (const subEntity of entity[key]) {
            await this.completeReturnedEntity(subEntity, ctx);
          }
        } else if (isObject(entity[key])) {
          await this.completeReturnedEntity(entity[key], ctx);
        }
      }
    }
  }
}
