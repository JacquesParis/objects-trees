import {model, property} from '@loopback/repository';
import {DataEntity} from './data-entity.model';

@model({settings: {strict: false}})
export abstract class RestEntity extends DataEntity {
  public fieldsObjectUris: {[fieldName: string]: string} = {};
  public abstract baseObjectUri: string;

  protected static getBaseObjectUri(entityName: string) {
    return (
      '/' +
      entityName
        .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
        .substr(1) +
      's/'
    );
  }

  @property({
    type: 'string',
  })
  uri?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<RestEntity>) {
    super(data);
  }
}

export interface ObjectEntityRelations {
  // describe navigational properties here
}

export type ObjectEntityWithRelations = RestEntity & ObjectEntityRelations;
