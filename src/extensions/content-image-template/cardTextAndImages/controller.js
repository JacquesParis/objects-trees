function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},

    getGalleriePosition(dataNode, templateNode, siteTemplateNode) {
      if (
        'none' ===
        this.getGalleryObjectTree(dataNode, templateNode, siteTemplateNode)
      ) {
        return 'none';
      }
      if (
        dataNode &&
        dataNode.templatesConfigurations &&
        dataNode.templatesConfigurations.cardTextAndImages &&
        dataNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition &&
        dataNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition !== ''
      ) {
        return dataNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition;
      } else if (
        templateNode &&
        templateNode.templatesConfigurations &&
        templateNode.templatesConfigurations.cardTextAndImages &&
        templateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition &&
        templateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition !== ''
      ) {
        return templateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition;
      } else if (
        siteTemplateNode &&
        siteTemplateNode.templatesConfigurations &&
        siteTemplateNode.templatesConfigurations.cardTextAndImages &&
        siteTemplateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition &&
        siteTemplateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition !== ''
      ) {
        return siteTemplateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryPosition;
      } else {
        return 'after';
      }
    },

    getGalleryObjectTree(dataNode, templateNode, siteTemplateNode) {
      if (
        dataNode &&
        dataNode.templatesConfigurations &&
        dataNode.templatesConfigurations.cardTextAndImages &&
        dataNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree
      ) {
        return dataNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree;
      } else if (
        templateNode &&
        templateNode.templatesConfigurations &&
        templateNode.templatesConfigurations.cardTextAndImages &&
        templateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree
      ) {
        return templateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree;
      } else if (
        siteTemplateNode &&
        siteTemplateNode.templatesConfigurations &&
        siteTemplateNode.templatesConfigurations.cardTextAndImages &&
        siteTemplateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree
      ) {
        return siteTemplateNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree;
      } else {
        return 'none';
      }
    },
  };
}
newFunction();
