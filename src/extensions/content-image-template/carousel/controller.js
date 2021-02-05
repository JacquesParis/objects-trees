function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},
    async initMustache() {
      if (!this.ctrl.dataNode.images && this.ctrl.dataTree.images) {
        this.ctrl.dataNode.images = this.ctrl.dataTree.images;
      }
      if (this.ctrl.dataNode.images) {
        this.ctrl.singleImage = 1 === this.ctrl.dataNode.images.length;
        for (
          let imageIndex = 0;
          imageIndex < this.ctrl.dataNode.images.length;
          imageIndex++
        ) {
          this.ctrl.dataNode.images[imageIndex].index = imageIndex;
          this.ctrl.dataNode.images[imageIndex].imageClass =
            0 === imageIndex ? ' active' : '';
          this.ctrl.dataNode.images[imageIndex].imgSrc = this.ctrl.getImgSrc({
            uri: this.ctrl.dataNode.images[imageIndex].treeNode.contentImageUri,
          });
        }
      }
    },
  };
}
newFunction();
