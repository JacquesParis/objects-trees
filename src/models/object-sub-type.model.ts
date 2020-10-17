import {IObjectSubType} from '@jacquesparis/objects-model';
import {belongsTo, model, property} from '@loopback/repository';
import {DataEntity} from './data-entity.model';
import {ObjectType, ObjectTypeRelations} from './object-type.model';

@model({settings: {strict: false}})
export class ObjectSubType extends DataEntity implements IObjectSubType {
  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'number',
    default: 10,
  })
  index?: number;

  @property({
    type: 'number',
    default: 0,
  })
  min?: number;

  @property({
    type: 'number',
    default: Number.MAX_SAFE_INTEGER,
  })
  max?: number;

  @property({
    type: 'boolean',
    default: false,
  })
  owner?: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  acl?: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  tree?: boolean;

  @property({
    type: 'boolean',
    default: false,
  })
  namespace?: boolean;

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  exclusions?: string[];

  @property({
    type: 'array',
    itemType: 'string',
    default: [],
  })
  mandatories?: string[];

  @belongsTo(() => ObjectType)
  objectTypeId: string;

  @belongsTo(() => ObjectType)
  subObjectTypeId: string;
  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ObjectSubType>) {
    super(data);
  }
}

export interface ObjectSubTypeRelations {
  // describe navigational properties here
  objectType: ObjectTypeRelations;
  subObjectType: ObjectTypeRelations;
}

export type ObjectSubTypeWithRelations = ObjectSubType & ObjectSubTypeRelations;
