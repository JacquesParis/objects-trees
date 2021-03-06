import {IEntityContext, IRestEntity} from '@jacquesparis/objects-model';
import {model, property} from '@loopback/repository';
import {DataEntity} from './data-entity.model';
import {EntityName} from './entity-name';

export interface IEntityServerContext extends IEntityContext {
  implementedTypes?: string[];
}

export interface IRestEntityServer extends IRestEntity {
  entityCtx?: IEntityServerContext;
}

@model({settings: {strict: false}})
export abstract class RestEntity extends DataEntity {
  public abstract entityName: EntityName;
  entityCtx?: IEntityServerContext;

  @property({
    type: 'string',
  })
  uri?: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<RestEntity>) {
    super(data);
  }
}

export interface ObjectEntityRelations {
  // describe navigational properties here
}

export type ObjectEntityWithRelations = RestEntity & ObjectEntityRelations;
