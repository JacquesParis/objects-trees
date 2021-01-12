function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {
      return;
    },
    async showImg(imageIndex) {
      if (0 > imageIndex) {
        imageIndex = this.ctrl.dataTree.treeNode.images.length - 1;
      }
      if (imageIndex >= this.ctrl.dataTree.treeNode.images.length) {
        imageIndex = 0;
      }
      this.modalIndex = imageIndex;
      const imageTree = this.ctrl.dataTree.treeNode.images[imageIndex];
      this.modalImage = imageTree.treeNode;
      this.modalTitle =
        imageTree.treeNode.imageTitle ||
        this.ctrl.dataNode.paragraphTitle ||
        this.ctrl.dataNode.pageTitle ||
        this.ctrl.dataNode.menuTitle ||
        this.ctrl.dataTree.parentPageTitle ||
        '';
      console.log(imageIndex);
      if (imageTree.original) {
        //  await imageTree.original.waitForReady();
        this.modalImage = imageTree.original;
      }
      this.ctrl.refresh();
    },
  };
}
newFunction();
