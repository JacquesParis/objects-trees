import {IObjectNode, IObjectType} from '@jacquesparis/objects-model';
import {belongsTo, model, property} from '@loopback/repository';
import {EntityName} from './entity-name';
import {ObjectType, ObjectTypeRelations} from './object-type.model';
import {RestEntity} from './rest-entity.model';
@model({settings: {strict: false}})
export class ObjectNode extends RestEntity implements IObjectNode {
  public entityName: EntityName = EntityName.objectNode;
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'boolean',
    default: false,
  })
  owner?: boolean;

  @property({
    type: 'number',
    default: 10000,
  })
  index?: number;

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

  @property({type: 'array', default: [], itemType: 'string'})
  aclList?: string[];

  @belongsTo(() => ObjectType)
  objectTypeId: string;

  @belongsTo(() => ObjectNode)
  parentNodeId: string;

  @belongsTo(() => ObjectNode)
  parentOwnerId: string;

  @belongsTo(() => ObjectNode)
  parentTreeId: string;

  @belongsTo(() => ObjectNode)
  parentNamespaceId: string;

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
  parentTree: IObjectNode;
  parentNamespace: IObjectNode;
  parentACL: IObjectNode;
}

export interface ObjectNodeRelations {
  // describe navigational properties here
  objectType: ObjectTypeRelations;
  parentNode: ObjectNodeWithRelations;
  parentOwner: ObjectNodeWithRelations;
  parentTree: ObjectNodeWithRelations;
  parentNamespace: ObjectNodeWithRelations;
  parentACL: ObjectNodeWithRelations;
}

export type ObjectNodeWithRelations = ObjectNode & ObjectNodeRelations;
