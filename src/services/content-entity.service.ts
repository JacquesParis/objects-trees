import {bind, /*inject, */ BindingScope} from '@loopback/core';

export interface ContentEntityServiceInterface {}

@bind({scope: BindingScope.TRANSIENT})
export class ContentEntityService {
  protected contentTypes: {
    [contentType: string]: ContentEntityServiceInterface;
  } = {};
  constructor(/* Add @inject to inject parameters */) {}

  public registerNewContentType(
    contentType: string,
    service: ContentEntityServiceInterface,
  ) {
    this.contentTypes[contentType] = service;
  }
  /*
   * Add service methods here
   */
}
