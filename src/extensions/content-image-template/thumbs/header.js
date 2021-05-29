/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function thumbsShowImg(document, dataNodeId, imageIndex) {
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
  if (
    document
      .querySelector('#modalImgGal' + dataNodeId + ' .mapFullScreen')
      .classList.contains('modal-body-hidden')
  ) {
    thumbsShowImage(document, dataNodeId);
  } else {
    thumbsShowMap(document, dataNodeId);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function thumbsShowMap(document, dataNodeId) {
  document
    .querySelector('#modalImgGal' + dataNodeId + ' .mapFullScreen')
    .classList.remove('modal-body-hidden');
  document.querySelector(
    '#modalImgGal' + dataNodeId + ' .show-map',
  ).disabled = true;
  document.querySelector(
    '#modalImgGal' + dataNodeId + ' .show-image',
  ).disabled = false;
  document.querySelector('#modalImgGal' + dataNodeId)._map.invalidateSize();

  const popup = document.querySelector(
    `#thumb_${dataNodeId}_${document
      .querySelector('#modalImgGal' + dataNodeId)
      .getAttribute('data-thumbs-modalIndex')}`,
  )._popup;
  const map = document.querySelector('#modalImgGal' + dataNodeId)._map;
  if (popup) {
    map.setView(popup.getLatLng());
    map.openPopup(popup);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function thumbsShowImage(document, dataNodeId) {
  document
    .querySelector('#modalImgGal' + dataNodeId + ' .mapFullScreen')
    .classList.add('modal-body-hidden');
  document.querySelector(
    '#modalImgGal' + dataNodeId + ' .show-map',
  ).disabled = false;
  document.querySelector(
    '#modalImgGal' + dataNodeId + ' .show-image',
  ).disabled = true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function displayImageMap(document, dataNodeId, display) {
  const id = 'map_' + dataNodeId;
  loadStyle('/popup/popup.css');
  loadStyle('/leaflet/leaflet.css');
  await loadScript('/leaflet/leaflet.js');

  loadStyle('/markercluster/MarkerCluster.css');
  loadStyle('/markercluster/MarkerCluster.Default.css');
  await loadScript('/markercluster/leaflet.markercluster.js');

  const map = L.map(id).setView([51.505, -0.09], 13);

  const osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    // LIGNE 20
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  });

  map.addLayer(osmLayer);

  const bounds = [];
  const markers = L.markerClusterGroup();
  for (const position of display.positions) {
    const marker = L.marker(position.position, {
      icon: L.icon({
        iconUrl: position.src,
        // iconUrl: 'http://leafletjs.com/examples/custom-icons/leaf-green.png',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    /*
    (async function () {
      // eslint-disable-next-line no-undef
      const popup = await loadPopup(position.popupHref);
      marker.bindPopup(popup, {className: 'map-popup'});
    })();
    */
    const popup = L.popup().setLatLng(position.position).setContent(`
    <a onclick="thumbsShowImage(document, '${dataNodeId}');thumbsShowImg(document, '${dataNodeId}', ${position.index})">
     <img src="${position.src}">
     </a>
   `);
    marker.bindPopup(popup);
    document.querySelector(
      `#thumb_${dataNodeId}_${position.index}`,
    )._popup = popup;

    markers.addLayer(marker);
    bounds.push(position.position);
  }

  map.addLayer(markers);
  if (0 < bounds.length) {
    map.fitBounds(bounds, {maxZoom: 15, padding: [40, 40]});
  }

  /*
    const marker = L.marker([51.5, -0.09]).addTo(map);
    const circle = L.circle([51.508, -0.11], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500,
    }).addTo(map);
    const polygon = L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047],
    ]).addTo(map);
    marker.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();
    circle.bindPopup('I am a circle.');
    polygon.bindPopup('I am a polygon.');
    const popup = L.popup()
      .setLatLng([51.5, -0.09])
      .setContent('I am a standalone popup.')
      .openOn(map);
      */
  return map;
}
