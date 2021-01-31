import {BindingScope, injectable} from '@loopback/core';
import * as Mustache from 'mustache';

@injectable({scope: BindingScope.SINGLETON})
export class MustacheService {
  constructor() {}
  public setInCache(template: string) {
    Mustache.parse(template);
  }

  public parse(
    template: string,
    object: Object,
    templates: {[templateId: string]: string} = {},
  ) {
    return Mustache.render(template, object, templates);
  }
}
