import {service} from '@loopback/core';
import {indexOf, map} from 'lodash';
import {EntityName} from '../../models';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {PAGE_TYPE} from './../web-site/web-site.const';
import {PopupBuilder, WebSiteService} from './../web-site/web-site.service';

export class ContentImageTemplateService {
  constructor(
    @service(WebSiteService)
    private webSiteService: WebSiteService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(UriCompleteService)
    protected uriCompleteService: UriCompleteService,
    @service(InsideRestService) protected insideRestService: InsideRestService,
  ) {
    this.webSiteService.registerPopupContributor(
      this.contributeToPopup.bind(this),
    );
  }

  public async contributeToPopup(
    popupNode: ObjectNode,
    popupBuilder: PopupBuilder,
    ctx: CurrentContext,
  ): Promise<boolean> {
    if (popupNode.images && 0 < popupNode.images.length) {
      for (const image of popupNode.images) {
        popupBuilder.popupParts.images.push({
          uri: image.thumb.contentImageUri,
          text: image.treeNode.imageTitle
            ? image.treeNode.imageTitle
            : image.treeNode.name,
        });
      }
    }
    const popupTree = (await this.insideRestService.read(
      this.uriCompleteService.getUri(
        EntityName.objectTree,
        popupNode.id as string,
        ctx,
      ),
      ctx,
    )) as ObjectTree;
    await this.lookForImages(popupTree, popupBuilder.popupParts.images, ctx);

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

  async lookForImages(
    objectTree: ObjectTree,
    images: {uri: string; text: string | undefined}[],
    ctx: CurrentContext,
  ) {
    for (const child of objectTree.children) {
      if (child.treeNode.imageGalleryObjectTreeId) {
        const imagesNode = await this.insideRestService.read(
          child.treeNode.uri as string,
          ctx,
        );
        if (imagesNode.images && 0 < imagesNode.images.length) {
          for (const image of imagesNode.images) {
            if (
              -1 ===
              indexOf(
                map(images, (img) => img.uri),
                image.thumb.contentImageUri,
              )
            ) {
              images.push({
                uri: image.thumb.contentImageUri,
                text: image.treeNode.imageTitle
                  ? image.treeNode.imageTitle
                  : image.treeNode.name,
              });
            }
          }
        }
      }
    }

    for (const child of objectTree.children) {
      await this.lookForImages(child, images, ctx);
    }
  }
}
