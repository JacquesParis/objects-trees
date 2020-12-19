import {ObjectTypeDefinition} from './../../integration/extension.provider';
import {ApplicationService} from './../application.service';

export const TEMPLATES_OBJECT_NAME = 'templates';
export const PUBLIC_OBJECT_NAME = 'public';

export const REPOSITORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
  definition: {properties: {}},
  contentType: '',
};

export const FOLDER_TYPE: ObjectTypeDefinition = {
  name: 'Folder',
  definition: {properties: {}},
  contentType: '',
};

export const TENANT_TYPE: ObjectTypeDefinition = {
  name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
  inheritedTypesIds: [FOLDER_TYPE.name],
  definition: {
    properties: {
      /*
      firstname: {
        type: 'string',
        title: 'Firstname',
        default: '',
        minLength: 2,
        required: true,
      },
      lastname: {
        type: 'string',
        title: 'Lastname',
        default: '',
        minLength: 2,
        required: true,
      },
      email: {
        type: 'string',
        title: 'Email',
        default: '',
        minLength: 2,
        required: true,
      },
      address: {
        type: 'string',
        title: 'Address',
        default: '',
        minLength: 2,
        required: false,
      },*/
    },
  },
  contentType: '',
};

export const REPOSITORY_CATEGORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY_CATEGORY,
  definition: {properties: {}},
  contentType: '',
};
