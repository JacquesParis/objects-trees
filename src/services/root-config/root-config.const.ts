import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from './../../integration/extension.provider';
import {ROOT_TYPE} from './../object-tree/object-tree.const';
export const ROOT_CONFIG_PROVIDER = 'RootConfigProvider';

export const ROOT_CONFIGURATION_TYPE: ObjectTypeDefinition = {
  name: 'RootConfiguration',
};

export const ROOT_ROOT_CONFIGURATION_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: ROOT_TYPE.name,
  subTypeName: ROOT_CONFIGURATION_TYPE.name,
  min: 1,
  max: 1,
};
