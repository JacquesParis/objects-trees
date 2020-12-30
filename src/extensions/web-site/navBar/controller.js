function newFunction() {
  return {
    async init(component) {
      $('body').css('padding-top', '3.5rem');
    },
  };
}
newFunction();
