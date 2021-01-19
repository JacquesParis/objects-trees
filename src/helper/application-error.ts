/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApplicationErrors,
  APPLICATION_ERRORS,
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
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.AUTHENTICATION_NEEDED].statusCode
      ]('Authentication is required and has not been provided.'),
      APPLICATION_ERRORS[ApplicationErrors.AUTHENTICATION_NEEDED].errorCode,
      {},
    );
  }

  public static forbiden(): ApplicationError {
    return new ApplicationError(
      new HttpErrors[APPLICATION_ERRORS[ApplicationErrors.FORBIDEN].statusCode](
        'The access rights do not allow access to this resource.',
      ),
      APPLICATION_ERRORS[ApplicationErrors.FORBIDEN].errorCode,
      {},
    );
  }
  public static authenticationFailed(): HttpErrors.HttpError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.AUTHENTICATION_FAILED].statusCode
      ]('Authentication failed.'),
      APPLICATION_ERRORS[ApplicationErrors.AUTHENTICATION_FAILED].errorCode,
      {},
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static unexpectedError(err: any): ApplicationError {
    console.log(err);
    if (undefined !== err.statusCode) {
      return new ApplicationError(
        err,
        APPLICATION_ERRORS[ApplicationErrors.UNEXPECTED_ERROR].errorCode,
        {},
      );
    }
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.UNEXPECTED_ERROR].statusCode
      ]('The request could not be executed as requested.'),
      APPLICATION_ERRORS[ApplicationErrors.UNEXPECTED_ERROR].errorCode,
      {},
    );
  }

  public static notFound(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.NOT_FOUND].statusCode
      ](
        'No ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),

      APPLICATION_ERRORS[ApplicationErrors.NOT_FOUND].errorCode,
      fields,
    );
  }

  public static wrongValue(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.WRONG_VALUE].statusCode
      ](
        'Wrong value accessing ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.WRONG_VALUE].errorCode,
      fields,
    );
  }

  public static format(
    format: string,
    fields: {[field: string]: any},
  ): ApplicationError {
    return new ApplicationError(
      new HttpErrors[APPLICATION_ERRORS[ApplicationErrors.FORMAT].statusCode](
        'Format error. Format expected ' +
          format +
          ' for ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.FORMAT].errorCode,
      merge({format}, fields),
    );
  }

  public static tooMany(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[
          ApplicationErrors.TOO_MANY_OBJECT_CONSTRAINT
        ].statusCode
      ](
        'Too many ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[
        ApplicationErrors.TOO_MANY_OBJECT_CONSTRAINT
      ].errorCode,
      fields,
    );
  }

  public static corruptedData(fields: {
    [field: string]: any;
  }): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.CORRUPTED_OBJECT].statusCode
      ](
        'Corrupted ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),

      APPLICATION_ERRORS[ApplicationErrors.CORRUPTED_OBJECT].errorCode,
      fields,
    );
  }

  public static conflict(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[APPLICATION_ERRORS[ApplicationErrors.CONFLICT].statusCode](
        'Duplicated ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.CONFLICT].errorCode,
      fields,
    );
  }

  public static missing(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[APPLICATION_ERRORS[ApplicationErrors.MISSING].statusCode](
        'Missing ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.MISSING].errorCode,
      fields,
    );
  }

  public static incompatible(fields: {[field: string]: any}): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.INCOMBATIBLE].statusCode
      ](
        'Incombatibe with ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.INCOMBATIBLE].errorCode,
      fields,
    );
  }

  public static missingParameter(parameter: string): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.MISSING_PARAMETER].statusCode
      ]('Missing parameter ' + parameter),
      APPLICATION_ERRORS[ApplicationErrors.MISSING_PARAMETER].errorCode,
      {parameter: parameter},
    );
  }

  public static unauthorizedValue(fields: {
    [field: string]: any;
  }): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.UNAUTHORIZED_VALUE].statusCode
      ](
        'Unauthorized ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.UNAUTHORIZED_VALUE].errorCode,
      fields,
    );
  }

  public static notImplemented(fields: {
    [field: string]: any;
  }): ApplicationError {
    return new ApplicationError(
      new HttpErrors[
        APPLICATION_ERRORS[ApplicationErrors.NOT_IMPLEMENTED].statusCode
      ](
        'Not implemented ' +
          Object.keys(fields)
            .map((key) => key + ' ' + fields[key])
            .join(', '),
      ),
      APPLICATION_ERRORS[ApplicationErrors.NOT_IMPLEMENTED].errorCode,
      fields,
    );
  }
}
