import {ApplicationConfig} from '@loopback/core';
import {ObjectTypeProviderClass} from './object-types/object-type.provider';
export interface ObjectTreesApplicationConfig extends ApplicationConfig {
  objectTypes?: ObjectTypeProviderClass[];
}
