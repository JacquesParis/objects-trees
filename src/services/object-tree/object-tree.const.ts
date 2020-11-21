import {ApplicationService} from './../application.service';

export const REPOSITORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.REPOSITORY,
  definition: {properties: {}},
  contentType: '',
};

export const TENANT_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.TENANT,
  definition: {
    properties: {
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
      },
    },
  },
  contentType: '',
};

export const CATEGORY_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.CATEGORY,
  definition: {properties: {}},
  contentType: '',
};
