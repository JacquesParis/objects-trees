import {
  ObjectSubTypeDefinition,
  ObjectTypeDefinition,
} from '../../integration/extension.provider';
import {ROOT_CONFIGURATION_TYPE} from '../../services/root-config/root-config.const';
import {CONTENT_ENCRYPTED_OBJECT} from './../content-encrypted-object/content-encrypted-object.const';

export const SERVER_CONFIG_PROVIDER = 'ServerConfigProvider';

export const SERVER_CONFIGURATION_TYPE: ObjectTypeDefinition = {
  name: 'ServerConfiguration',
  iconView: 'fas fa-server',
  contentType: CONTENT_ENCRYPTED_OBJECT,
  definition: {
    properties: {},
  },
};

export const ROOT_CONFIGURATION_SERVER_CONFIGURATION_SUBTYPE: ObjectSubTypeDefinition = {
  typeName: ROOT_CONFIGURATION_TYPE.name,
  subTypeName: SERVER_CONFIGURATION_TYPE.name,
  min: 1,
  max: 1,
};
