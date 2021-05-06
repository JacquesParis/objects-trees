function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {
      if (this.ctrl.pageNode && this.ctrl.pageNode.paragraphNodes) {
        for (const paragraph of this.ctrl.pageNode.paragraphNodes) {
          await paragraph.waitForReady();
          this.ctrl.refresh();
        }
      }
      if (this.ctrl.pageNode && this.ctrl.pageNode.pageNodes) {
        for (const page of this.ctrl.pageNode.pageNodes) {
          await page.waitForReady();
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
      this.ctrl.paragraphNodes = [this.ctrl.dataNode];
      this.ctrl.hasPageNodes =
        !this.ctrl.dataNode.paragraphNodes &&
        this.ctrl.dataNode.pageNodes &&
        0 < this.ctrl.dataNode.pageNodes.length;
      if (this.ctrl.hasPageNodes) {
        await this.initPageNodes(this.ctrl.dataNode);
      }
      await this.initParagraphNodes(this.ctrl.dataNode);
    },

    async initPageNodes(dataNode) {
      for (const pageIndex of Object.keys(dataNode.pageNodes)) {
        if (!dataNode.pageNodes[pageIndex].entityCtx.loaded) {
          dataNode.pageNodes[pageIndex] = await this.ctrl.getObjectNode(
            dataNode.pageNodes[pageIndex].id,
          );
        }
        const pageTreeTemplate = this.getPageTreeTemplate(
          dataNode.pageNodes[pageIndex],
          this.ctrl.templateNode,
          this.ctrl.siteTemplateNode,
        );
        dataNode.pageNodes[pageIndex].pageAjax = await this.ctrl.loadAjax(
          dataNode.pageNodes[pageIndex],
          pageTreeTemplate,
        );
        if (
          dataNode.pageNodes[pageIndex].pageNodes &&
          0 < dataNode.pageNodes[pageIndex].pageNodes.length
        ) {
          dataNode.pageNodes[pageIndex].hasPageNodes = true;
          await this.initPageNodes(dataNode.pageNodes[pageIndex]);
        } else {
          dataNode.pageNodes[pageIndex].hasPageNodes = false;
        }
      }
    },
    async initParagraphNodes(dataNode) {
      const paragraphTreeTemplate = this.getParagraphTreeTemplate(
        dataNode,
        this.ctrl.templateNode,
        this.ctrl.siteTemplateNode,
      );
      dataNode.paragraphAjax = await this.ctrl.loadAjax(
        dataNode,
        paragraphTreeTemplate,
      );
      if (dataNode.paragraphNodes && 0 < dataNode.paragraphNodes.length) {
        dataNode.hasParagraphNodes = true;
        for (const paragraphIndex of Object.keys(dataNode.paragraphNodes)) {
          if (!dataNode.paragraphNodes[paragraphIndex].entityCtx.loaded) {
            dataNode.paragraphNodes[
              paragraphIndex
            ] = await this.ctrl.getObjectNode(
              dataNode.paragraphNodes[paragraphIndex].id,
            );
          }
          await this.initParagraphNodes(
            dataNode.paragraphNodes[paragraphIndex],
          );
        }
      } else {
        dataNode.hasParagraphNodes = false;
      }
    },
  };
}
newFunction();
