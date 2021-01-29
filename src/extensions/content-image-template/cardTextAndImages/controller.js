function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      if (!ctrl.dataNode.images && ctrl.dataTree.images) {
        ctrl.dataNode.images = ctrl.dataTree.images;
      }
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},
    async initMustache() {
      if (!this.ctrl.dataNode.images && this.ctrl.dataTree.images) {
        this.ctrl.dataNode.images = this.ctrl.dataTree.images;
      }
      if (
        this.ctrl.dataNode.linkedPageTreeId &&
        !this.ctrl.dataNode.linkedPageTree
      ) {
        this.ctrl.dataNode.linkedPageTree = await this.ctrl.getObjectTree(
          this.ctrl.dataNode.linkedPageTreeId,
        );
      }
      if (this.ctrl.dataNode.linkedPageTree) {
        this.ctrl.linkedPageTreeHref = this.ctrl.getPageHref(
          this.ctrl.dataNode.linkedPageTree,
        );
      }
      this.ctrl.galleryObjectTree = this.getGalleryObjectTree(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl.galleriePosition = this.getGalleriePosition(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl.paragraphColClass = this.getParagraphColClass(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl[this.ctrl.galleriePosition + 'GalleriePosition'] = true;
      this.ctrl.hasCardBody =
        (this.ctrl.dataNode.paragraphTitle &&
          '' !== this.ctrl.dataNode.paragraphTitle) ||
        (this.ctrl.dataNode.contentText &&
          '' !== this.ctrl.dataNode.contentText);
      if (
        !this.ctrl.hasCardBody &&
        (this.ctrl.leftGalleriePosition || this.ctrl.rightGalleriePosition)
      ) {
        this.ctrl.galleriePosition = 'after';
        this.ctrl.leftGalleriePosition = this.ctrl.rightGalleriePosition = false;
        this.ctrl.afterGalleriePosition = true;
      }
      this.ctrl.hasAnyContent =
        this.ctrl.hasCardBody || !this.ctrl.noneGalleriePosition;
      this.ctrl.hasCardTitle =
        this.ctrl.dataNode.paragraphTitle &&
        '' !== this.ctrl.dataNode.paragraphTitle;
      this.ctrl.titleClass = this.titleClass(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl.parentPageTitle = this.displayParentPageTitle(
        this.ctrl.dataTree,
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl.galleryColClass = this.getGalleryColClass(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      this.ctrl.hasContentText =
        this.ctrl.dataNode.contentText && '' !== this.ctrl.dataNode.contentText;
      this.ctrl.contentClass = this.contentClass(
        this.ctrl.dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );

      this.ctrl.cardImgAjax = await this.ctrl.loadAjax(
        this.ctrl.dataTree,
        this.ctrl.galleryObjectTree,
      );
    },

    searchConfigInObject(object, configName, configKey) {
      if (
        object &&
        object.templatesConfigurations &&
        object.templatesConfigurations[configName] &&
        undefined !== object.templatesConfigurations[configName] &&
        null !== object.templatesConfigurations[configName][configKey] &&
        object.templatesConfigurations[configName][configKey] !== ''
      ) {
        return object.templatesConfigurations[configName][configKey];
      }
      return undefined;
    },

    searchConfig(objects, configName, configKey, defaultValue) {
      for (const object of objects) {
        const value = this.searchConfigInObject(object, configName, configKey);
        if (undefined !== value) return value;
      }
      return defaultValue;
    },

    getGalleriePosition(dataNode, templateNode, siteTemplateNode) {
      if (
        'none' ===
        this.getGalleryObjectTree(dataNode, templateNode, siteTemplateNode)
      ) {
        return 'none';
      }
      if (!dataNode || !dataNode.images || 0 === dataNode.images.length) {
        return 'none';
      }

      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'imageGalleryPosition',
        'after',
      );
    },

    getGalleryObjectTree(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'imageGalleryTree',
        'none',
      );
    },

    galleryMaxWidth(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'galleryMaxWidth',
        6,
      );
    },

    galleryMinWidth(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'galleryMinWidth',
        5,
      );
    },

    galleryBreakLine(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'galleryBreakLine',
        'sm',
      );
    },

    paragraphBreakLine(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'paragraphBreakLine',
        'xl',
      );
    },
    paragraphMaxWidth(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'paragraphMaxWidth',
        6,
      );
    },
    paragraphMinWidth(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'paragraphMinWidth',
        12,
      );
    },

    paragraphKeepProportion(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'paragraphKeepProportion',
        false,
      );
    },

    getParagraphColClass(dataNode, templateNode, siteTemplateNode) {
      return this.ctrl.getColFloatClass(
        this.paragraphMinWidth(dataNode, templateNode, siteTemplateNode),
        this.paragraphMaxWidth(dataNode, templateNode, siteTemplateNode),
        this.paragraphBreakLine(dataNode, templateNode, siteTemplateNode),
        'left',
        this.paragraphKeepProportion(dataNode, templateNode, siteTemplateNode),
      );
    },

    getGalleryColClass(dataNode, templateNode, siteTemplateNode) {
      return this.ctrl.getColFloatClass(
        this.galleryMinWidth(dataNode, templateNode, siteTemplateNode),
        this.galleryMaxWidth(dataNode, templateNode, siteTemplateNode),
        this.galleryBreakLine(dataNode, templateNode, siteTemplateNode),
        this.getGalleriePosition(dataNode, templateNode, siteTemplateNode),
      );
    },

    displayParentPageTitle(dataTree, dataNode, templateNode, siteTemplateNode) {
      return dataTree.parentPageTitle &&
        dataTree.parentPageTitle !== dataNode.paragraphTitle &&
        this.searchConfig(
          [dataNode, templateNode, siteTemplateNode],
          'cardTextAndImages',
          'displayParentPageTitle',
          true,
        )
        ? dataTree.parentPageTitle
        : false;
    },

    titleClass(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'titleClass',
        '',
      );
    },

    contentClass(dataNode, templateNode, siteTemplateNode) {
      return this.searchConfig(
        [dataNode, templateNode, siteTemplateNode],
        'cardTextAndImages',
        'contentClass',
        '',
      );
    },
  };
}
newFunction();
