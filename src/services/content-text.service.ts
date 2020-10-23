import {bind, /*inject, */ BindingScope, service} from '@loopback/core';
import {
  ContentEntityService,
  ContentEntityServiceInterface,
  EntityWithContent
} from './content-entity.service';
import {MemoryFile} from './file-upload.service';

@bind({scope: BindingScope.SINGLETON})
export class ContentTextService implements ContentEntityServiceInterface {
  constructor(
    @service(ContentEntityService)
    public contentEntityService: ContentEntityService,
  ) {
    this.contentEntityService.registerNewContentType('ContentText', this);
  }
  public manageContent(
    entity: EntityWithContent,
    loadedFiles: MemoryFile[],
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public getContent(entity: EntityWithContent, fieldName:string, args: { [key:string]:any;}):any{
    throw new Error('Method not implemented.');
  }
}
