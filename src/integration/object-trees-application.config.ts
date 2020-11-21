import {ApplicationConfig} from '@loopback/core';
import {ExtensionProviderClass} from './extension.provider';
export interface ObjectTreesApplicationConfig extends ApplicationConfig {
  extensions?: ExtensionProviderClass[];
}
