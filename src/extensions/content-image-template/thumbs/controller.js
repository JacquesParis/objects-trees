function newFunction() {
  return {
    async init(ctrl) {
      if (ctrl.dataNode && ctrl.dataNode.images) {
        for (const image of ctrl.dataNode.images) {
          image.waitForReady();
        }
      }
    },
  };
}
newFunction();
