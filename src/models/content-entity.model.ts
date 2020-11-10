import {model} from '@loopback/repository';
import {DataEntity} from './data-entity.model';

@model({settings: {strict: false}})
export class ContentEntity extends DataEntity {
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ContentEntity>) {
    super(data);
  }
}

export interface ContentEntityRelations {
  // describe navigational properties here
}

export type ContentEntityWithRelations = ContentEntity & ContentEntityRelations;
