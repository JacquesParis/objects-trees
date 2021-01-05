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
  };
}
newFunction();
