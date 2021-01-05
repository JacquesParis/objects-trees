function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {
      if (this.ctrl.pageTree && this.ctrl.pageTree.paragraphTrees) {
        for (const paragraph of this.ctrl.pageTree.paragraphTrees) {
          await paragraph.treeNode.waitForReady();
          this.ctrl.refresh();
        }
      }
      if (this.ctrl.pageTree && this.ctrl.pageTree.pageTrees) {
        for (const page of this.ctrl.pageTree.pageTrees) {
          await page.treeNode.waitForReady();
          this.ctrl.refresh();
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
