import {belongsTo, model, property} from '@loopback/repository';
import {RestEntity} from '.';
import {ObjectType, ObjectTypeRelations} from './object-type.model';

@model({settings: {strict: false}})
export class ObjectNode extends RestEntity {
  @property({
    type: 'string',
  })
  contentType?: string;

  @belongsTo(() => ObjectType)
  objectTypeId: string;

  @belongsTo(() => ObjectNode)
  parentNodeId: string;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ObjectNode>) {
    super(data);
  }
}

export interface ObjectNodeRelations {
  // describe navigational properties here
  objectType: ObjectTypeRelations;
}

export type ObjectNodeWithRelations = ObjectNode & ObjectNodeRelations;
