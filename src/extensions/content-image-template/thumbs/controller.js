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
        this.ctrl.dataNode.parentPageTitle ||
        '';
      if (imageTree.original) {
        //  await imageTree.original.waitForReady();
        this.modalImage = imageTree.original;
      }
      this.ctrl.refresh();
    },
    async initMustache() {
      if (!this.ctrl.dataNode.images && this.ctrl.dataTree.images) {
        this.ctrl.dataNode.images = this.ctrl.dataTree.images;
      }
      const positions = [];
      this.ctrl.colClass = this.ctrl.getColClass(6, 3, 'xs');
      if (this.ctrl.dataNode.images) {
        this.ctrl.singleImage = 1 === this.ctrl.dataNode.images.length;
        for (const imageIndex in this.ctrl.dataNode.images) {
          if (this.ctrl.dataNode.images[imageIndex].treeNode.imagePosition) {
            positions.push({
              position: this.ctrl.dataNode.images[
                imageIndex
              ].treeNode.imagePosition.split(','),
              index: imageIndex,
              src: this.ctrl.dataNode.images[imageIndex].thumb
                ? this.ctrl.getImgSrc({
                    uri: this.ctrl.dataNode.images[imageIndex].thumb
                      .contentImageUri,
                  })
                : this.ctrl.getImgSrc({
                    uri: this.ctrl.dataNode.images[imageIndex].treeNode
                      .contentImageUri,
                  }),
              title: this.ctrl.dataNode.images[imageIndex].treeNode.title,
            });
          }
          this.ctrl.dataNode.images[imageIndex].index = imageIndex;
          this.ctrl.dataNode.images[imageIndex].imageClass =
            0 === imageIndex ? ' active' : '';
          this.ctrl.dataNode.images[imageIndex].imgSrc = this.ctrl.getImgSrc({
            uri: this.ctrl.dataNode.images[imageIndex].treeNode.contentImageUri,
          });
          this.ctrl.dataNode.images[imageIndex].thumbSrc = this.ctrl.dataNode
            .images[imageIndex].thumb
            ? this.ctrl.getImgSrc({
                uri: this.ctrl.dataNode.images[imageIndex].thumb
                  .contentImageUri,
              })
            : this.ctrl.getImgSrc({
                uri: this.ctrl.dataNode.images[imageIndex].treeNode
                  .contentImageUri,
              });

          // eslint-disable-next-line no-constant-condition
          if (false && this.ctrl.dataNode.images[imageIndex].original) {
            this.ctrl.dataNode.images[
              imageIndex
            ].imgBackground = this.ctrl.getImgBackground({
              uri: this.ctrl.dataNode.images[imageIndex].original
                .contentImageUri,
            });
          } else {
            this.ctrl.dataNode.images[
              imageIndex
            ].imgBackground = this.ctrl.getImgBackground({
              uri: this.ctrl.dataNode.images[imageIndex].treeNode
                .contentImageUri,
            });
          }
          this.ctrl.dataNode.images[imageIndex].modalTitle =
            this.ctrl.dataNode.images[imageIndex].treeNode.imageTitle ||
            this.ctrl.dataNode.paragraphTitle ||
            this.ctrl.dataNode.pageTitle ||
            this.ctrl.dataNode.menuTitle ||
            this.ctrl.dataNode.parentPageTitle ||
            '';
        }
      }

      this.ctrl.jsonPositions = JSON.stringify(
        positions,
      ); /*.replace(
        /"/g,
        '&quot;',
      );*/
    },
  };
}
newFunction();
