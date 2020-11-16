import {ObjectTreesApplicationInterface} from '../../application';

export type ObjectTypeProviderClass = new (
  app: ObjectTreesApplicationInterface,
) => ObjectTypeProvider;

export interface ObjectTypeProvider {}
