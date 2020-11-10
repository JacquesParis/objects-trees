import {
  ERROR_401_AUTHENTICATION_FAILED,
  ERROR_401_AUTHENTICATION_NEEDED,
  ERROR_424_UNEXPECTED_ERROR,
  IObjectError,
} from '@jacquesparis/objects-model';
import {HttpErrors} from '@loopback/rest';
import {merge} from 'lodash';

export class ApplicationError implements IObjectError, HttpErrors.HttpError {
  public status: number;
  public statusCode: number;
  public expose: boolean;
  public headers?: {[key: string]: string} | undefined;
  public name: string;
  public stack?: string | undefined;
  public message: string;
  private constructor(
    error: HttpErrors.HttpError,
    public errorCode: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public errorArgs: {[field: string]: any},
  ) {
    merge(this, error);
  }
  public static authenticationNeeded(): ApplicationError {
    return new ApplicationError(
      new HttpErrors.Unauthorized(
        'Authentication is required and has not been provided.',
      ),
      ERROR_401_AUTHENTICATION_NEEDED,
      {},
    );
  }
  public static authenticationFailed(): HttpErrors.HttpError {
    return new ApplicationError(
      new HttpErrors.Unauthorized('Authentication failed.'),
      ERROR_401_AUTHENTICATION_FAILED,
      {},
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static unexpectedError(err: any): ApplicationError {
    if (undefined !== err.statusCode) {
      return new ApplicationError(err, ERROR_424_UNEXPECTED_ERROR, {});
    }
    return new ApplicationError(
      new HttpErrors[424]('The request could not be executed as requested.'),
      ERROR_424_UNEXPECTED_ERROR,
      {},
    );
  }
}
