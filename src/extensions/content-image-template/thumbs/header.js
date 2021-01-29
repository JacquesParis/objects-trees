// eslint-disable-next-line @typescript-eslint/no-unused-vars
function thumbsShowImg(document, dataNodeId, imageIndex) {
  const images = document.querySelectorAll(
    '#row-imag_' + dataNodeId + ' .card-img-top',
  );
  if (0 > imageIndex) {
    imageIndex = images.length - 1;
  }
  if (imageIndex >= images.length) {
    imageIndex = 0;
  }
  document
    .querySelector('#modalImgGal' + dataNodeId)
    .setAttribute('data-thumbs-modalIndex', '' + imageIndex);
  document.querySelector(
    '#modalImgGal' + dataNodeId + ' .modal-title',
  ).innerHTML = images[imageIndex].getAttribute('data-thumbs-modalTitle');
  document.querySelector('#modalImgGal' + dataNodeId + ' .imgFullScreen').style[
    'background-image'
  ] = images[imageIndex].getAttribute('data-thumbs-imgBackground');
}
