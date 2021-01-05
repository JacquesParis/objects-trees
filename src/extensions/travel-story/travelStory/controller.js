function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},
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
