import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {ObjectTreeService} from './../../services/object-tree/object-tree.service';
import {TransientEntityService} from './../../services/transient-entity/transient-entity.service';
import {POST_PROVIDER, POST_WITH_SUB_POST_TYPE} from './post.const';

export class PostService {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
    @service(ObjectTreeService)
    private objectTreeService: ObjectTreeService,
  ) {
    this.transientEntityService.registerTransientEntityTypeFunction<ObjectTree>(
      POST_PROVIDER,
      PostService.name,
      'Add postTrees field, list of sub-post',
      EntityName.objectTree,
      POST_WITH_SUB_POST_TYPE.name,
      this.completePostWithSubPostTree.bind(this),
    );
  }

  async completePostWithSubPostTree(
    entity: ObjectTree,
    ctx: CurrentContext,
  ): Promise<void> {
    const postTrees: ObjectTree[] = (
      await this.objectTreeService.getChildrenByImplentedTypeId(entity)
    )[POST_WITH_SUB_POST_TYPE.name];
    entity.postTrees = postTrees ? postTrees : [];
  }
}
