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
      if (pageNode && pageNode.pageTemplateTree) {
        return pageNode.pageTemplateTree;
      }
      if (templateNode && templateNode.pageTemplateTree) {
        return templateNode.pageTemplateTree;
      }
      return siteTemplateNode.pageTemplateTree;
    },
    getParagraphTreeTemplate(pageNode, templateNode, siteTemplateNode) {
      if (pageNode && pageNode.paragraphTemplateTree) {
        return pageNode.paragraphTemplateTree;
      }
      if (templateNode && templateNode.paragraphTemplateTree) {
        return templateNode.paragraphTemplateTree;
      }
      return siteTemplateNode.paragraphTemplateTree;
    },
    async initMustache() {
      this.ctrl.pageTitle =
        this.ctrl.dataNode.pageTitle || this.ctrl.dataNode.menuTitle;
      this.ctrl.paragraphTrees = [this.ctrl.dataTree];
      this.ctrl.hasPageTrees =
        !this.ctrl.dataTree.paragraphTrees &&
        this.ctrl.dataTree.pageTrees &&
        0 < this.ctrl.dataTree.pageTrees.length;
      if (this.ctrl.hasPageTrees) {
        await this.initPageTrees(this.ctrl.dataTree);
      }
      await this.initParagraphTrees(this.ctrl.dataTree);
    },

    async initPageTrees(dataTree) {
      for (const childTree of dataTree.pageTrees) {
        const pageTreeTemplate = this.getPageTreeTemplate(
          childTree.treeNode,
          this.ctrl.templateNode,
          this.ctrl.siteTemplateNode,
        );
        childTree.pageAjax = await this.ctrl.loadAjax(
          childTree,
          pageTreeTemplate,
        );
        if (childTree.pageTrees && 0 < childTree.pageTrees.length) {
          childTree.hasPageTrees = true;
          await this.initPageTrees(childTree);
        } else {
          childTree.hasPageTrees = false;
        }
      }
    },
    async initParagraphTrees(dataTree) {
      const paragraphTreeTemplate = this.getParagraphTreeTemplate(
        dataTree.treeNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      dataTree.paragraphAjax = await this.ctrl.loadAjax(
        dataTree,
        paragraphTreeTemplate,
      );
      if (dataTree.paragraphTrees && 0 < dataTree.paragraphTrees.length) {
        dataTree.hasParagraphTrees = true;
        for (const childTree of dataTree.paragraphTrees) {
          await this.initParagraphTrees(childTree);
        }
      } else {
        dataTree.hasParagraphTrees = false;
      }
    },
  };
}
newFunction();
