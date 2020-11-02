import {belongsTo, model, property} from '@loopback/repository';
import {ContentEntity} from '.';
import {ObjectNode, ObjectNodeRelations} from './object-node.model';

@model({settings: {strict: false}})
export class ContentText extends ContentEntity {
  @property({
    type: 'string',
  })
  text?: string;

  @belongsTo(() => ObjectNode)
  objectNodeId: string;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ContentText>) {
    super(data);
  }
}

export interface ContentTextRelations {
  // describe navigational properties here
  objectNode: ObjectNodeRelations;
}

export type ContentTextWithRelations = ContentText & ContentTextRelations;
