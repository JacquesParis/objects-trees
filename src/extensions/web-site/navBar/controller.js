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
  };
}
newFunction();
