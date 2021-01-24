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
    async initMustache() {
      this.ctrl.navHtml = await this.ctrl.loadHtml(
        this.ctrl.dataTree,
        this.ctrl.templateNode.menuTree,
      );
      this.ctrl.pageHtml = await this.ctrl.loadHtml(
        this.ctrl.pageTree,
        this.getPageTreeTemplate(
          this.ctrl.pageNode,
          this.ctrl.templateNode,
          this.ctrl.siteTemplateNode,
        ),
      );
    },
  };
}
newFunction();
