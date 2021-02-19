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
      if (this.ctrl.dataNode.map && this.ctrl.dataNode.map.positions) {
        this.ctrl.hasMap = true;

        for (const position of this.ctrl.dataNode.map.positions) {
          let popup = position.popupTemplate.text;
          for (const id in position.popupTemplate.uris) {
            popup = popup.replace(
              new RegExp(id, 'g'),
              this.ctrl.getPageHref({
                treeNode: {id: position.popupTemplate.uris[id].pageId},
              }),
            );
          }
          position.popup = popup;
        }

        this.ctrl.jsonPositions = JSON.stringify(
          this.ctrl.dataNode.map.positions,
        );
      }
    },
  };
}
newFunction();
