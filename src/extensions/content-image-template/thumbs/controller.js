function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},
    async showImg(imageTree, imageIndex) {
      this.modalIndex = imageIndex;
      if (0 < this.modalIndex) {
        this.modalPrevious = this.ctrl.dataTree.treeNode.images[
          this.modalIndex - 1
        ];
      } else {
        this.modalPrevious = null;
      }
      if (this.ctrl.dataTree.treeNode.images.length - 1 > this.modalIndex) {
        this.modalNext = this.ctrl.dataTree.treeNode.images[
          this.modalIndex + 1
        ];
      } else {
        this.modalNext = null;
      }
      this.modalImage = imageTree.treeNode;
      this.modalTitle = imageTree.treeNode.imageTitle
        ? imageTree.treeNode.imageTitle
        : '';
      if (imageTree.original) {
        this.modalImage = imageTree.original;
      }
      this.ctrl.refresh();
    },
  };
}
newFunction();
