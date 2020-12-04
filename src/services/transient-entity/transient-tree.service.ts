import {IRestEntity} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {EntityName} from '../../models';
import {CurrentContext} from '../application.service';
import {ObjectTree} from './../../models/object-tree.model';
import {
  TransientEntityInterface,
  TransientEntityService,
} from './transient-entity.service';
export class TransientTreeService implements TransientEntityInterface {
  constructor(
    @service(TransientEntityService)
    private transientEntityService: TransientEntityService,
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
    const objectTree: ObjectTree = entity as ObjectTree;
    await this.transientEntityService.completeReturnedEntity(
      EntityName.objectNode,
      objectTree.treeNode,
      ctx,
      false,
    );
    for (const child of objectTree.children) {
      await this.transientEntityService.completeReturnedEntity(
        EntityName.objectTree,
        child,
        ctx,
        !child.treeNode.tree,
      );
    }
  }
}
