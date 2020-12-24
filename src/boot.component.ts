import {Component, service} from '@loopback/core';
import {AccessRightsNodeService} from './services/access-rights/access-rights-node.service';
import {AccessRightsTreeService} from './services/access-rights/access-rights-tree.service';
import {AccessRightsTypeService} from './services/access-rights/access-rights-type.service';
import {AccessRightsUserService} from './services/access-rights/access-rights-user.service';
import {AccessRightsService} from './services/access-rights/access-rights.service';
import {ApplicationService} from './services/application.service';
import {ContentFileService} from './services/content-entity/content-file.service';
import {ContentTextService} from './services/content-entity/content-text.service';
import {ContentUserService} from './services/content-entity/content-user.service';
import {ObjectTreeService} from './services/object-tree/object-tree.service';

export class ObjectTreesBootComponent implements Component {
  constructor(
    @service(ContentFileService) contentFileService: ContentFileService,
    @service(ContentTextService) contentTextService: ContentTextService,
    @service(ContentUserService) contentUserService: ContentUserService,
    @service(ObjectTreeService) objectTreeService: ObjectTreeService,
    @service(AccessRightsService) accessRightsService: AccessRightsService,
    @service(AccessRightsTreeService)
    accessRightTreeService: AccessRightsTreeService,
    @service(AccessRightsNodeService)
    accessRightNodeService: AccessRightsNodeService,
    @service(AccessRightsTypeService)
    accessRightTypeService: AccessRightsTypeService,
    @service(AccessRightsUserService)
    accessRightUserService: AccessRightsUserService,
    @service(ApplicationService)
    private appCtx: ApplicationService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.init().then(() => {
      console.log('Application contexte initialized');
    });
  }
  private async init(): Promise<void> {
    await this.appCtx.ready;
  }
}
