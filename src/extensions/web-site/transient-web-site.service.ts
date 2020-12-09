import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {find, indexOf} from 'lodash';
import {EntityName} from '../../models';
import {CurrentContext} from '../../services';
import {ObjectTree} from './../../models/object-tree.model';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './../../services/transient-entity/transient-entity.service';
import {WEB_SITE_VIEW_TYPE, WELCOME_PAGE_TYPE} from './web-site-type.const';

export class TransientWebSiteService implements TransientEntityInterface {
  constructor(
    @service(TransientEntityService)
    protected transientEntityService: TransientEntityService,
  ) {
    this.transientEntityService.registerTransientEntityService(
      EntityName.objectTree,
      this,
    );
  }
  async completeReturnedEntity(
    entity: IRestEntity,
    ctx: CurrentContext,
  ): Promise<void> {
    if (EntityName.objectTree === entity?.entityCtx?.entityType) {
      const objectTree: ObjectTree = entity as ObjectTree;
      if (
        -1 <
        indexOf(objectTree.entityCtx?.implementedTypes, WEB_SITE_VIEW_TYPE.name)
      ) {
        const welcomePage: ObjectTree | undefined = find(
          objectTree.children,
          (child) =>
            -1 <
            indexOf(child.entityCtx?.implementedTypes, WELCOME_PAGE_TYPE.name),
        );
        if (welcomePage) {
          entity.welcomePageId = welcomePage.id;
          entity.welcomePageUri = welcomePage.uri;
        }
      }
    }
  }
}
