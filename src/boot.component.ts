import {Component, service} from '@loopback/core';
import {ContentTextService} from './services';
import {AccessRightsService} from './services/access-rights.service';
import {ContentFileService} from './services/content-file.service';
import {ContentUserService} from './services/content-user.service';
import {ObjectTreeService} from './services/object-tree.service';

export class BootComponent implements Component {
  constructor(
    @service(ContentFileService) contentFileService: ContentFileService,
    @service(ContentTextService) contentTextService: ContentTextService,
    @service(ContentUserService) contentUserService: ContentUserService,
    @service(ObjectTreeService) objectTreeService: ObjectTreeService,
    @service(AccessRightsService) accessRightsService: AccessRightsService,
  ) {}
}
