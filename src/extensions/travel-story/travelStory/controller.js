function newFunction() {
  return {
    async init(component) {
      if (component.pageTree && component.pageTree.pageTrees) {
        for (const page of component.pageTree.pageTrees) {
          await page.treeNode.waitForReady();
        }
      }
    },
    getPageTreeTemplate(pageNode, templateNode) {
      if (pageNode && pageNode.pageObjectTree) {
        return pageNode.pageObjectTree;
      }
      return templateNode.pageObjectTree;
    },
  };
}
newFunction();
