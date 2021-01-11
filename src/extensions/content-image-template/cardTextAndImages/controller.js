function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},

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

    getParagraphColClass(dataNode, templateNode, siteTemplateNode) {
      return this.ctrl.getColFloatClass(
        this.paragraphMinWidth(dataNode, templateNode, siteTemplateNode),
        this.paragraphMaxWidth(dataNode, templateNode, siteTemplateNode),
        this.paragraphBreakLine(dataNode, templateNode, siteTemplateNode),
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
  };
}
newFunction();
