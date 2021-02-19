import {service} from '@loopback/core';
import {indexOf} from 'lodash';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTypeService} from './../../services/object-type.service';
import {PAGE_TYPE} from './../web-site/web-site.const';
import {PopupBuilder, WebSiteService} from './../web-site/web-site.service';

export class ContentImageTemplateService {
  constructor(
    @service(WebSiteService)
    private webSiteService: WebSiteService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
  ) {
    this.webSiteService.registerPopupContributor(
      this.contributeToPopup.bind(this),
    );
  }

  public async contributeToPopup(
    popupNode: ObjectNode,
    popupBuilder: PopupBuilder,
  ): Promise<boolean> {
    if (popupNode.images && 0 < popupNode.images.length) {
      for (const image of popupNode.images) {
        popupBuilder.popupParts.imgs.push({
          uri: image.thumb.contentImageUri,
          text: image.treeNode.imageTitle
            ? image.treeNode.imageTitle
            : image.treeNode.name,
        });
      }
    }
    if (
      popupNode.imageGalleryTree &&
      -1 <
        indexOf(
          await this.objectTypeService.getImplementedTypes(
            popupNode.imageGalleryTree.treeNode.objectTypeId,
          ),
          PAGE_TYPE.name,
        )
    ) {
      popupBuilder.pageHrefs[
        '__href_' + popupNode.imageGalleryTree.treeNode.id
      ] = {
        pageId: popupNode.imageGalleryTree.treeNode.id as string,
        pageName: popupNode.imageGalleryTree.treeNode.name,
      };
      popupBuilder.popupParts.links.push({
        uri: '__href_' + popupNode.imageGalleryTree.treeNode.id,
        text: popupBuilder.popupLinkLabels.galleryLinkLabel
          ? popupBuilder.popupLinkLabels.galleryLinkLabel
          : 'Navigate to gallery',
      });
    }
    return true;
  }
}
