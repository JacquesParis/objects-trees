import {Entity, model, property} from '@loopback/repository';
import {v4 as uuid} from 'uuid';

@model({settings: {strict: false}})
export class DataEntity extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    default: () => uuid(),
  })
  id?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<DataEntity>) {
    super(data);
  }
}

export interface DataEntityRelations {
  // describe navigational properties here
}

export type DataEntityWithRelations = DataEntity & DataEntityRelations;
