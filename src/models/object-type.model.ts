import {IObjectType} from '@jacquesparis/objects-model';
import {hasMany, model, property} from '@loopback/repository';
import {
  ObjectSubType,
  ObjectSubTypeWithRelations,
} from './object-sub-type.model';
import {RestEntity} from './rest-entity.model';

export type ObjectContentType =
  | ''
  | 'ContentFile'
  | 'ContentFiles'
  | 'ContentText';

@model({settings: {strict: false}})
export class ObjectType extends RestEntity implements IObjectType {
  public baseObjectUri: string = RestEntity.getBaseObjectUri('ObjectType');
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: false,
  })
  contentType: ObjectContentType;

  @property({
    required: false,
  })
  definition: unknown;

  @hasMany(() => ObjectSubType)
  objectSubTypes: ObjectSubType[];

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ObjectType>) {
    super(data);
  }
}

export interface ObjectTypeRelations {
  // describe navigational properties here
  objectSubTypes: ObjectSubTypeWithRelations[];
}

export type ObjectTypeWithRelations = ObjectType & ObjectTypeRelations;
