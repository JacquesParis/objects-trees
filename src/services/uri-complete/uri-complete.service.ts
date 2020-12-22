import {BindingScope, injectable} from '@loopback/core';
import {isArray, isObject, isString} from 'lodash';
import {toKebabCase} from '../../helper';
import {EntityName} from './../../models/entity-name';
import {CurrentContext} from './../application.service';

type EntityType = {
  id?: string;
  uri?: string;
  entityName?: EntityName;
  [key: string]: unknown;
};

@injectable({scope: BindingScope.SINGLETON})
export class UriCompleteService {
  public addUri(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: EntityType | EntityType[] | any,
    ctx: CurrentContext,
    baseUri?: string,
    objectUri?: string,
    deep = 0,
  ) {
    if (deep > 2) {
      return;
    }

    if (!baseUri) {
      baseUri = ctx.uriContext.uri.value.baseUri;
    }
    if (!objectUri) {
      objectUri = ctx.uriContext.uri.value.objectUri;
    }

    if (isArray(result)) {
      result.forEach((item) => {
        this.addUri(item, ctx, baseUri, objectUri, deep);
      });
    } else if (isObject(result)) {
      if ('entityName' in result) {
        deep = 0;
        objectUri =
          '/' +
          this.getEntityUri((result as EntityType).entityName as string) +
          '/';
        //   delete (result as EntityType).entityName;
      }
      if ('id' in result && !(result as EntityType).uri) {
        (result as EntityType).uri =
          baseUri + objectUri + (result as EntityType).id;
      }
      Object.keys(result).forEach((key) => {
        if (
          isObject((result as EntityType)[key]) ||
          isArray((result as EntityType)[key])
        ) {
          this.addUri(
            (result as EntityType)[key],
            ctx,
            baseUri,
            `${objectUri}${(result as EntityType).id}/${this.getEntityUri(
              key,
            )}/`,
            deep + 1,
          );
        } else if (
          isString((result as EntityType)[key]) &&
          key.endsWith('Id')
        ) {
          const field = key.substr(0, key.length - 2);
          if (!(result as EntityType)[field + 'Uri']) {
            const entityUri: string = this.getEntityUri(field);

            if (entityUri === toKebabCase(field)) {
              (result as EntityType)[field + 'Uri'] = `${baseUri}${objectUri}${
                (result as EntityType).id
              }/${entityUri}/${(result as EntityType)[key]}`;
            } else {
              (result as EntityType)[
                field + 'Uri'
              ] = `${baseUri}/${entityUri}/${(result as EntityType)[key]}`;
            }
          }
        }
      });
    }
  }

  protected getEntityUri(entityName: EntityName | string): string {
    if (entityName.endsWith('ObjectNode')) {
      return 'object-nodes';
    }
    if (entityName.endsWith('ObjectTree')) {
      return 'object-trees';
    }
    if (entityName.endsWith('ObjectType')) {
      return 'object-types';
    }
    switch (entityName) {
      case EntityName.objectType:
      case 'subObjectType':
        return 'object-types';
      case EntityName.objectNode:
      case 'parentNode':
      case 'parentAcl':
      case 'parentOwner':
      case 'parentNamespace':
      case 'parentTree':
        return 'object-nodes';
      default:
        if (entityName in EntityName) {
          return toKebabCase(entityName) + 's';
        }
        return toKebabCase(entityName);
    }
  }
}
