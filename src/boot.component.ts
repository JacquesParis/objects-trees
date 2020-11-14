import {Component, service} from '@loopback/core';
import {ContentTextService} from './services';
import {AccessRightNodeService} from './services/access-rights/access-rights-node.service';
import {AccessRightTreeService} from './services/access-rights/access-rights-tree.service';
import {AccessRightTypeService} from './services/access-rights/access-rights-type.service';
import {AccessRightUserService} from './services/access-rights/access-rights-user.service';
import {AccessRightsService} from './services/access-rights/access-rights.service';
import {ContentFileService} from './services/content-file.service';
import {ContentUserService} from './services/content-user.service';
import {ObjectTreeService} from './services/object-tree/object-tree.service';

export class ObjectsTreesBootComponent implements Component {
  constructor(
    @service(ContentFileService) contentFileService: ContentFileService,
    @service(ContentTextService) contentTextService: ContentTextService,
    @service(ContentUserService) contentUserService: ContentUserService,
    @service(ObjectTreeService) objectTreeService: ObjectTreeService,
    @service(AccessRightsService) accessRightsService: AccessRightsService,
    @service(AccessRightTreeService)
    accessRightTreeService: AccessRightTreeService,
    @service(AccessRightNodeService)
    accessRightNodeService: AccessRightNodeService,
    @service(AccessRightTypeService)
    accessRightTypeService: AccessRightTypeService,
    @service(AccessRightUserService)
    accessRightUserService: AccessRightUserService,
  ) {}
}
