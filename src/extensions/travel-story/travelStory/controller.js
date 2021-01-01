function newFunction() {
  return {
    async init(component) {},
    getPageTreeTemplate(pageNode, templateNode, siteTemplateNode) {
      if (pageNode && pageNode.pageTemplateObjectTree) {
        return pageNode.pageTemplateObjectTree;
      }
      if (templateNode && templateNode.pageTemplateObjectTree) {
        return templateNode.pageTemplateObjectTree;
      }
      return siteTemplateNode.pageTemplateObjectTree;
    },
  };
}
newFunction();
