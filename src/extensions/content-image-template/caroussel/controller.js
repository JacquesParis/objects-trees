function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {
      if (this.ctrl.dataNode && this.ctrl.dataNode.images) {
        for (const image of this.ctrl.dataNode.images) {
          await image.treeNode.waitForReady();
          this.ctrl.refresh();
        }
      }
    },
  };
}
newFunction();
