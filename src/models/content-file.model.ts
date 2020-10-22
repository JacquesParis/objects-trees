import {model, property} from '@loopback/repository';
import {ContentEntity} from '.';

@model({settings: {strict: false}})
export class ContentFile extends ContentEntity {
  @property({
    type: 'buffer',
    required: true,
  })
  file: Buffer;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<ContentFile>) {
    super(data);
  }
}

export interface ContentFileRelations {
  // describe navigational properties here
}

export type ContentFileWithRelations = ContentFile & ContentFileRelations;
