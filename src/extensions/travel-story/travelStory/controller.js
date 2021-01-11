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
      if (pageNode && pageNode.pageTemplateTree) {
        return pageNode.pageTemplateTree;
      }
      if (templateNode && templateNode.pageTemplateTree) {
        return templateNode.pageTemplateTree;
      }
      return siteTemplateNode.pageTemplateTree;
    },
  };
}
newFunction();
