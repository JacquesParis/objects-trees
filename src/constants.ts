import {BindingKey} from '@loopback/core';

export const STORAGE_DIRECTORY = BindingKey.create<string>('storage.directory');

export const AUTHORIZATION_SERVICE = 'authorizationProviders.appAuthorization';
