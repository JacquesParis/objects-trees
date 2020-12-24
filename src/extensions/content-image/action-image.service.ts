import {service} from '@loopback/core';
import {ActionEntityService} from '../../services/action-entity/action-entity.service';
import {ObjectNodeService} from '../../services/object-node/object-node.service';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {CurrentContext} from './../../services/application.service';
import {
  CONTENT_IMAGE_PROVIDER,
  IMAGE_GALLERY_TYPE,
  IMAGE_TYPE,
} from './content-image.const';
import {Image} from './content-image.definition';

export class ActionImageService {
  constructor(
    @service(ActionEntityService)
    protected actionEntityService: ActionEntityService,
    @service(ObjectNodeService)
    private objectNodeService: ObjectNodeService,
  ) {
    this.actionEntityService.registerNewActionTypeFunction(
      CONTENT_IMAGE_PROVIDER,
      ActionImageService.name,
      'Load and create several Image entities in an Image Gallery',
      EntityName.objectNode,
      'load',
      IMAGE_GALLERY_TYPE.name,
      this.loadImageGalleryNode.bind(this),
    );
  }

  public async loadImageGalleryNode(
    gallery: ObjectNode,
    args: Object,
    ctx: CurrentContext,
  ): Promise<void> {
    const images: {images: Image[]} = args as {images: Image[]};
    for (const image of images.images) {
      const childCtx: CurrentContext = CurrentContext.get({
        nodeContext: {
          parent: ctx.nodeContext.node,
          parentType: ctx.nodeContext.objectType,
        },
      });
      const nameParts = image.name.split('.');
      if (1 < nameParts.length) {
        nameParts.pop();
      }

      await this.objectNodeService.add(
        {
          name: nameParts.join('.'),
          parentNodeId: gallery.id,
          objectTypeId: IMAGE_TYPE.name,
          contentImage: image,
        },
        childCtx,
      );
    }
  }
}
