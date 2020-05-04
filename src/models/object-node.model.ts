import {IObjectNode, IObjectType} from '@jacquesparis/objects-model';
import {belongsTo, model, property} from '@loopback/repository';
import {RestEntity} from '.';
import {ObjectType, ObjectTypeRelations} from './object-type.model';
@model({settings: {strict: false}})
export class ObjectNode extends RestEntity implements IObjectNode {
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @belongsTo(() => ObjectType)
  objectTypeId: string;

  @belongsTo(() => ObjectNode)
  parentNodeId: string;

  @belongsTo(() => ObjectNode)
  parentOwnerId: string;

  @belongsTo(() => ObjectNode)
  parentACLId: string;
  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ObjectNode>) {
    super(data);
  }
  objectType: IObjectType;
  parentNode: IObjectNode;
  parentOwner: IObjectNode;
  parentACL: IObjectNode;
}

export interface ObjectNodeRelations {
  // describe navigational properties here
  objectType: ObjectTypeRelations;
  parentNode: ObjectNodeWithRelations;
  parentOwner: ObjectNodeWithRelations;
  parentACL: ObjectNodeWithRelations;
}

export type ObjectNodeWithRelations = ObjectNode & ObjectNodeRelations;
