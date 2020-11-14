import {UserService} from '@loopback/authentication';
import {Credentials, User, UserRepository} from '@loopback/authentication-jwt';
import {repository} from '@loopback/repository';
import {securityId, UserProfile} from '@loopback/security';
import {compare, genSalt, hash} from 'bcryptjs';
import {ApplicationError} from './../helper/application-error';
import {EntityName} from './../models/entity-name';
import {AppUser, NewUserRequest} from './../models/new-user.model';
/* eslint-disable*/

export class UserAuthenticationService
  implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
  ) {}

  async registerUser(newUserRequest: NewUserRequest): Promise<UserProfile> {
    const newUser: AppUser = {
      email: newUserRequest.email,
      firstname: newUserRequest.firstname,
      lastname: newUserRequest.lastname,
      name: newUserRequest.name,
    };
    if (!newUser.email) {
      throw ApplicationError.missingParameter('email');
    }

    let savedUser = await this.userRepository.findOne({
      where: {email: newUser.email},
    });
    if (savedUser) {
      const credentialsFound = await this.userRepository.findCredentials(
        savedUser.id,
      );
      if (credentialsFound) {
        throw ApplicationError.conflict({email: newUser.email});
      }
      await this.userRepository.updateById(savedUser.id, newUser);
    } else {
      savedUser = await this.userRepository.create(newUser);
    }
    const password = await hash(
      savedUser.id + newUserRequest.password,
      await genSalt(),
    );
    await this.userRepository.userCredentials(savedUser.id).create({password});

    return this.convertToUserProfile(savedUser);
  }

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const invalidCredentialsError = 'Invalid email or password.';

    const foundUser = await this.userRepository.findOne({
      where: {email: credentials.email},
    });
    if (!foundUser) {
      throw ApplicationError.authenticationFailed();
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw ApplicationError.authenticationFailed();
    }

    const passwordMatched = await compare(
      foundUser.id + credentials.password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw ApplicationError.authenticationFailed();
    }

    return foundUser;
  }

  public convertToUserProfile(user: User): UserProfile {
    return {
      entityName: EntityName.user,
      [securityId]: user.id.toString(),
      id: user.id,
      name: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    };
  }

  async completeUserProfile(
    currentUserProfile: UserProfile,
  ): Promise<UserProfile> {
    return this.convertToUserProfile(
      await this.findUserById(currentUserProfile[securityId]),
    );
  }
  //function to find user by id
  async findUserById(id: string) {
    const userNotfound = 'invalid User';
    const foundUser = await this.userRepository.findOne({
      where: {id: id},
    });

    if (!foundUser) {
      throw ApplicationError.notFound({user: id});
    }
    return foundUser;
  }
}
