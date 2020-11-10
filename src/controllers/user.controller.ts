// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/example-todo-jwt
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
import {authenticate, TokenService} from '@loopback/authentication';
import {
  Credentials,
  TokenServiceBindings,
  User,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {
  get,
  getModelSchemaRef,
  post,
  requestBody,
  SchemaObject,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {merge} from 'lodash';
import {AppUser, NewUserRequest} from './../models/new-user.model';
import {
  AccessRightsEntity,
  AccessRightsScope,
} from './../services/access-rights.service';
import {UserAuthenticationService} from './../services/user-authentication.service';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userAuthenticationService: UserAuthenticationService,
    @inject(SecurityBindings.USER, {optional: true})
    public user: UserProfile,
  ) {}

  @post('/users/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user: User = await this.userAuthenticationService.verifyCredentials(
      credentials,
    );
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile: UserProfile = this.userAuthenticationService.convertToUserProfile(
      user,
    );

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);
    return merge(userProfile, {token});
  }

  @authenticate('jwt')
  @authorize({
    resource: AccessRightsEntity.user,
    scopes: [AccessRightsScope.read],
  })
  @get('/users/me', {
    responses: {
      '200': {
        description: 'Return current user',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': AppUser,
            },
          },
        },
      },
    },
  })
  async whoAmI(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    return this.userAuthenticationService.completeUserProfile(
      currentUserProfile,
    );
  }

  @authorize({
    resource: AccessRightsEntity.user,
    scopes: [AccessRightsScope.create],
  })
  @post('/users', {
    responses: {
      '200': {
        description: 'User',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': AppUser,
            },
          },
        },
      },
    },
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(NewUserRequest, {
            title: 'NewUser',
          }),
        },
      },
    })
    newUserRequest: NewUserRequest,
  ): Promise<UserProfile> {
    return this.userAuthenticationService.registerUser(newUserRequest);
  }
}
