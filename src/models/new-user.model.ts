import {IAppUser} from '@jacquesparis/objects-model';
import {model, property} from '@loopback/repository';

@model()
export class AppUser implements IAppUser {
  @property({
    type: 'string',
    required: true,
    format: 'email',
  })
  email: string;
  @property({
    type: 'string',
  })
  name: string;
  @property({
    type: 'string',
  })
  firstname: string;
  @property({
    type: 'string',
  })
  lastname: string;
}

@model()
export class NewUserRequest extends AppUser {
  @property({
    type: 'string',
    required: true,
    minLength: 8,
  })
  password: string;
}
