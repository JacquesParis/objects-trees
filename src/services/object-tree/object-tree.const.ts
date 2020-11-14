import {ApplicationService} from './../application.service';

export const ROOT_TYPE = {
  name: ApplicationService.OBJECT_TYPE_NAMES.ROOT,
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
