function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {
      this.ctrl.document.body.style.paddingTop = '3.5rem';
    },
    getHref(menuTree) {
      if (menuTree.adminEntry) {
        return this.ctrl.getAdminHref(menuTree.pageTree);
      } else {
        return this.ctrl.getPageHref(menuTree.pageTree);
      }
    },

    async initMustache() {
      this.ctrl.menuEntries = [];
      if (this.ctrl.siteTemplateNode) {
        for (const menuEntry of this.ctrl.siteTemplateNode.menuEntries) {
          if (
            this.ctrl.siteNode.menuEntries &&
            this.ctrl.siteNode.menuEntries[menuEntry.entryKey]
          ) {
            await this.initHref(
              this.ctrl.siteTree.menuEntries[menuEntry.entryKey],
            );
            this.ctrl.siteTree.menuEntries[
              menuEntry.entryKey
            ].menuTitle = this.ctrl.siteNode.menuEntries[menuEntry.entryKey];
            this.ctrl.menuEntries.push(
              this.ctrl.siteTree.menuEntries[menuEntry.entryKey],
            );
          }
        }
      }
    },
    async initHref(menuEntry) {
      if (menuEntry.pageTreeId) {
        menuEntry.pageTree = await this.ctrl.getObjectTree(
          menuEntry.pageTreeId,
        );
        menuEntry.href = this.getHref(menuEntry);
      }
      for (const child of menuEntry.children) {
        await this.initHref(child);
      }
    },
  };
}
newFunction();
