import {BindingScope, Component, createBindingFromClass} from '@loopback/core';
import {CurrentContext, CURRENT_CONTEXT} from './services/application.service';

export class ApplicationComponent implements Component {
  bindings = [
    createBindingFromClass(CurrentContext, {
      key: CURRENT_CONTEXT,
      defaultScope: BindingScope.REQUEST,
    }),
  ];
  constructor() {}
}
