function newFunction() {
  return {
    async init(ctrl) {
      if (ctrl.dataNode && ctrl.dataNode.images) {
        for (const image of ctrl.dataNode.images) {
          await image.waitForReady();
        }
      }
    },

    getGalleryObjectTree(dataNode, templateNode) {
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
      } else {
        return undefined;
      }
    },
  };
}
newFunction();
