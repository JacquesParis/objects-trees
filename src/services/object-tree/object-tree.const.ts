import {ObjectTypeDefinition} from './../../integration/extension.provider';
import {ApplicationService} from './../application.service';

export const OBJECT_TREE_PROVIDER = 'ObjectTreeProvider';
export const TEMPLATES_OBJECT_NAME = 'templates';
export const PUBLIC_OBJECT_NAME = 'public';

export const REPOSITORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
  definition: {properties: {}},
  contentType: '',
  iconView: 'fas fa-folder',
};

export const ROOT_TYPE: ObjectTypeDefinition = {
  name: 'Root',
  inheritedTypesIds: [REPOSITORY_TYPE.name],
  definition: {properties: {}},
  contentType: '',
  iconView: 'fas fa-robot',
};

export const FOLDER_TYPE: ObjectTypeDefinition = {
  name: 'Folder',
  definition: {properties: {}},
  contentType: '',
  iconView: 'far fa-folder',
};

export const TENANT_TYPE: ObjectTypeDefinition = {
  name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
  inheritedTypesIds: [FOLDER_TYPE.name],
  definition: {
    properties: {},
  },
  contentType: '',
  iconView: 'far fa-user-circle',
};

export const REPOSITORY_CATEGORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
  definition: {properties: {}},
  contentType: '',
  iconView: 'far fa-folder',
};

export const REPOSITORY_REPOSITORY_SUBTYPE = {
  typeName: REPOSITORY_TYPE.name,
  subTypeName: REPOSITORY_TYPE.name,
  acl: true,
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
  namespace: true,
  owner: true,
  tree: true,
};
export const REPOSITORY_REPOSITORY_CATEGORY_SUBTYPE = {
  typeName: REPOSITORY_TYPE.name,
  subTypeName: REPOSITORY_CATEGORY_TYPE.name,
  acl: true,
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
  namespace: true,
  owner: false,
  tree: true,
};
export const REPOSITORY_TENANT_SUBTYPE = {
  typeName: REPOSITORY_TYPE.name,
  subTypeName: TENANT_TYPE.name,
  acl: true,
  name: TENANT_TYPE.name,
  namespace: true,
  owner: true,
  tree: true,
};

export const FOLDER_FOLDER_SUBTYPE = {
  typeName: FOLDER_TYPE.name,
  subTypeName: FOLDER_TYPE.name,
  acl: true,
  name: FOLDER_TYPE.name,
  namespace: true,
  owner: false,
  tree: true,
};
