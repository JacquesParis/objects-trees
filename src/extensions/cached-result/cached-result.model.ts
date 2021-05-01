/* eslint-disable @typescript-eslint/no-explicit-any */
import {Entity, model, property} from '@loopback/repository';

@model()
export class CachedResult extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  hash: string;

  @property({
    type: 'object',
    required: true,
  })
  args: object;

  @property({
    type: 'object',
    required: true,
  })
  value: any;

  @property({type: 'string', required: true})
  endValidity: string;

  constructor(data?: Partial<CachedResult>) {
    super(data);
  }
}

export interface CachedResultRelations {
  // describe navigational properties here
}

export type CachedResultWithRelations = CachedResult & CachedResultRelations;
