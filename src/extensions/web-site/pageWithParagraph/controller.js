function newFunction() {
  return {
    async init(component) {
      if (component.pageTree && component.pageTree.paragraphTrees) {
        for (const paragraph of component.pageTree.paragraphTrees) {
          await paragraph.treeNode.waitForReady();
        }
      }
      if (component.pageTree && component.pageTree.pageTrees) {
        for (const page of component.pageTree.pageTrees) {
          await page.treeNode.waitForReady();
        }
      }
    },
    getPageTreeTemplate(pageNode, templateNode, siteTemplateNode) {
      if (pageNode && pageNode.pageTemplateObjectTree) {
        return pageNode.pageTemplateObjectTree;
      }
      if (templateNode && templateNode.pageTemplateObjectTree) {
        return templateNode.pageTemplateObjectTree;
      }
      return siteTemplateNode.pageTemplateObjectTree;
    },
    getParagraphTreeTemplate(pageNode, templateNode, siteTemplateNode) {
      if (pageNode && pageNode.paragraphTemplateObjectTree) {
        return pageNode.paragraphTemplateObjectTree;
      }
      if (templateNode && templateNode.paragraphTemplateObjectTree) {
        return templateNode.paragraphTemplateObjectTree;
      }
      return siteTemplateNode.paragraphTemplateObjectTree;
    },
  };
}
newFunction();
