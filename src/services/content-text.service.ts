import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
} from './content-entity.service';

@bind({scope: BindingScope.TRANSIENT})
export class ContentTextService implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {
    this.contentEntityService.registerNewContentType('ContentText', this);
  }
}
