import {IJsonSchema} from '@jacquesparis/objects-model';
import {service} from '@loopback/core';
import {cloneDeep, indexOf, merge} from 'lodash';
import sanitize from 'sanitize-html';
import {contentGenericTemplate} from '../../helper';
import {EntityName} from './../../models/entity-name';
import {ObjectNode} from './../../models/object-node.model';
import {ObjectTree} from './../../models/object-tree.model';
import {CurrentContext} from './../../services/application.service';
import {MustacheService} from './../../services/entity-definition/mustache.service';
import {InsideRestService} from './../../services/inside-rest/inside-rest.service';
import {ObjectTypeService} from './../../services/object-type.service';
import {UriCompleteService} from './../../services/uri-complete/uri-complete.service';
import {PAGE_TYPE} from './web-site.const';
import {MenuTree, Popup, WebSiteEvent} from './web-site.interface';

export interface PopupBuilder {
  pageHrefs: {
    [replaceId: string]: {pageId: string; pageName: string};
  };
  popupParts: {
    uri: string | undefined;
    title: string | undefined;
    subTitle: string | undefined;
    subTitleParts: string[];
    images: {uri: string; text: string | undefined}[];
    imageBlocs: {uri: string; text: string | undefined}[][];
    texts: {uri: string | undefined; text: string}[];
    links: {uri: string; text: string}[];
    btns: {uri: string; text: string}[];
  };
  popupLinkLabels: {[labelId: string]: string};
}
export class WebSiteService {
  popup: {
    templatesMustache: {[templateId: string]: string};
    templateMustache: string;
    headerScript: string;
    footerScript: string;
    templateAngular: string;
    scss: string;
    css: string;
    controller: string;
    refererConfig: IJsonSchema;
  };
  private popupContributors: ((
    popupNode: ObjectNode,
    builder: PopupBuilder,
    ctx: CurrentContext,
  ) => Promise<boolean>)[] = [];
  eventContributors: ((
    webSiteEvent: WebSiteEvent,
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    ctx: CurrentContext,
  ) => Promise<boolean>)[] = [];
  constructor(
    @service(InsideRestService)
    private insideRestService: InsideRestService,
    @service(ObjectTypeService)
    private objectTypeService: ObjectTypeService,
    @service(UriCompleteService) private uriCompleteService: UriCompleteService,
    @service(MustacheService) private mustacheService: MustacheService,
  ) {
    this.popup = contentGenericTemplate(__dirname, 'popup');
  }

  public registerPopupContributor(
    popupContributor: (
      popupNode: ObjectNode,
      builder: PopupBuilder,
      ctx: CurrentContext,
    ) => Promise<boolean>,
  ) {
    this.popupContributors.push(popupContributor);
  }

  public registerEventContributor(
    eventContributor: (
      webSiteEvent: WebSiteEvent,
      entriesTree: ObjectTree,
      menuTree: MenuTree,
      ctx: CurrentContext,
    ) => Promise<boolean>,
  ) {
    this.eventContributors.push(eventContributor);
  }

  public async buildEvent<T extends WebSiteEvent>(
    entriesTree: ObjectTree,
    menuTree: MenuTree,
    eventType: new (menuTree: MenuTree) => T,
    ctx: CurrentContext,
  ): Promise<T> {
    const event: WebSiteEvent = await WebSiteEvent.get<T>(
      entriesTree,
      menuTree,
      eventType,
      this.eventContributors,
      ctx,
    );
    return event as T;
  }

  public async getPopupContent(
    popupLinkLabels: {[labelId: string]: string},
    objectNode: ObjectNode,
    ctx: CurrentContext,
  ): Promise<Popup> {
    let popupNode = objectNode;
    if (!popupNode.entityCtx?.loaded) {
      popupNode = (await this.insideRestService.read(
        this.uriCompleteService.getUri(
          EntityName.objectNode,
          popupNode.id as string,
          ctx,
        ),
        ctx,
      )) as ObjectNode;
    }
    const popupBuilder: PopupBuilder = {
      popupLinkLabels: popupLinkLabels ? popupLinkLabels : {},
      pageHrefs: {},
      popupParts: {
        uri: undefined,
        title: popupNode.menuTitle
          ? popupNode.menuTitle
          : popupNode.pageTitle
          ? popupNode.pageTitle
          : popupNode.paragraphTitle
          ? popupNode.paragraphTitle
          : popupNode.name,
        subTitle: undefined,
        subTitleParts: [],
        texts: [],
        images: [],
        imageBlocs: [],
        links: [],
        btns: [],
      },
    };
    if (popupNode.contentText && '' !== popupNode.contentText) {
      let text = sanitize(popupNode.contentText);
      if (text.length > 100) {
        text = text.substr(0, 100) + '...';
      }
      popupBuilder.popupParts.texts.push({text: text, uri: undefined});
    }
    if (
      -1 <
      indexOf(
        await this.objectTypeService.getImplementedTypes(
          popupNode.objectTypeId,
        ),
        PAGE_TYPE.name,
      )
    ) {
      popupBuilder.pageHrefs['__href_' + popupNode.id] = {
        pageId: popupNode.id as string,
        pageName: popupNode.name,
      };
      popupBuilder.popupParts.links.push({
        uri: '__href_' + popupNode.id,
        text: popupBuilder.popupLinkLabels.pageLinkLabel
          ? popupBuilder.popupLinkLabels.pageLinkLabel
          : 'Navigate to story',
      });
    }

    for (const contributor of this.popupContributors) {
      if (!(await contributor(popupNode, popupBuilder, ctx))) {
        break;
      }
    }
    if (0 < popupBuilder.popupParts.subTitleParts.length) {
      popupBuilder.popupParts.subTitle = popupBuilder.popupParts.subTitleParts.join(
        ', ',
      );
    }
    if (5 < popupBuilder.popupParts.images.length) {
      const nbOfImages = popupBuilder.popupParts.images.length;
      const step = Math.ceil(nbOfImages / 11) + 1;
      let index = step;
      const availableImages = cloneDeep(popupBuilder.popupParts.images);
      popupBuilder.popupParts.imageBlocs.push([]);
      popupBuilder.popupParts.imageBlocs.push([]);
      while (availableImages.length > 0) {
        index = index % availableImages.length;
        popupBuilder.popupParts.imageBlocs[0].push(
          ...availableImages.splice(index, 1),
        );
        index += step;
        if (availableImages.length > 0) {
          index = index % availableImages.length;
          popupBuilder.popupParts.imageBlocs[1].push(
            ...availableImages.splice(index, 1),
          );
          index += step;
        }
      }
    } else {
      popupBuilder.popupParts.imageBlocs.push(
        cloneDeep(popupBuilder.popupParts.images),
      );
    }

    return {
      uris: popupBuilder.pageHrefs,
      text: this.mustacheService.parse(
        this.popup.templateMustache,
        merge(
          {
            hasImg: 0 < popupBuilder.popupParts.images.length,
            hasSeveralImagesBlocs:
              1 < popupBuilder.popupParts.imageBlocs.length,
          },
          popupBuilder.popupParts,
        ),
      ),
    };
  }
}
