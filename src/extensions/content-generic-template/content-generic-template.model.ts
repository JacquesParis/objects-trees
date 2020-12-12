import {belongsTo, Entity, model, property} from '@loopback/repository';
import {ContentEntity} from '../../models';
import {ObjectNode} from '../../models/object-node.model';
import {ObjectNodeRelations} from './../../models/object-node.model';

@model()
export class GenericTemplate extends Entity {
  @property({
    type: 'string',
  })
  template: string;
  @property({
    type: 'string',
  })
  scss: string;
}

@model({settings: {strict: false}})
export class ContentGenericTemplate extends ContentEntity {
  @property({
    type: 'object',
  })
  content: GenericTemplate;

  @belongsTo(() => ObjectNode)
  objectNodeId: string;

  constructor(data?: Partial<ContentGenericTemplate>) {
    super(data);
  }
}

export interface ContentGenericTemplateRelations {
  // describe navigational properties here
  objectNode: ObjectNodeRelations;
}

export type ContentGenericTemplateWithRelations = ContentGenericTemplate &
  ContentGenericTemplateRelations;
