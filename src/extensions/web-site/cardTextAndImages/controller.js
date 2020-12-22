newFunction();

function newFunction() {
  return {
    async init(ctrl) {
      if (ctrl.dataNode && ctrl.dataNode.images) {
        for (const image of ctrl.dataNode.images) {
          await image.waitForReady();
        }
      }
      ctrl.ready = true;
    },

    getGalleryObjectTree(pageNode, templateNode) {
      if (
        pageNode &&
        pageNode.templatesConfigurations &&
        pageNode.templatesConfigurations.cardTextAndImages &&
        pageNode.templatesConfigurations.cardTextAndImages
          .imageGalleryObjectTree
      ) {
        return pageNode.templatesConfigurations.cardTextAndImages
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
        return templateNode;
      }
    },
  };
}
