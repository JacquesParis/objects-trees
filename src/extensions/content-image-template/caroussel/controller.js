newFunction();

function newFunction() {
  return {
    async init(ctrl) {
      if (ctrl.dataNode && ctrl.dataNode.images) {
        for (const image of ctrl.dataNode.images) {
          await image.waitForReady();
        }
      }
      ctrl.ready = true;
    },
  };
}
