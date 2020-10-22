import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {ContentEntityService} from './content-entity.service';

@bind({scope: BindingScope.TRANSIENT})
export class ContentFileService {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {
    this.contentEntityService.registerNewContentType('ContentFile', this);
  }
}
