/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function openTooltip(element, popupHref) {
  if (!element.getAttribute('data-title')) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadPopup(popupHref).then((popup) => {
      element.setAttribute('data-title', popup);

      $(element).tooltip('toggle');
    });
  }
}
