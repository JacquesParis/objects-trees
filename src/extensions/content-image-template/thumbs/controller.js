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
      /*
      for (const image of this.ctrl.dataNode.images) {
        await image.treeNode.waitForReady();
        this.ctrl.refresh();
      }*/
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
      this.modalTitle = imageTree.treeNode.imageTitle
        ? imageTree.treeNode.imageTitle
        : '';
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
