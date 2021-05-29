/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-floating-promises */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function displayMap(id, display) {
  loadStyle('/popup/popup.css');
  loadStyle('/leaflet/leaflet.css');
  await loadScript('/leaflet/leaflet.js');

  loadStyle('/markercluster/MarkerCluster.css');
  loadStyle('/markercluster/MarkerCluster.Default.css');
  await loadScript('/markercluster/leaflet.markercluster.js');

  window.setTimeout(() => {
    const map = L.map(id).setView([51.505, -0.09], 13);

    const osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      // LIGNE 20
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    map.addLayer(osmLayer);

    const icons = {};
    const bounds = [];
    const markers = L.markerClusterGroup();
    for (const position of display.positions) {
      if (!(position.icon in icons)) {
        icons[position.icon] = L.divIcon({
          className: position.icon + ' fa-3x',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      }

      const marker = L.marker(position.position, {
        icon: icons[position.icon],
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async function () {
        const popup = await loadPopup(position.popupHref);
        marker.bindPopup(popup, {className: 'map-popup'});
      })();

      markers.addLayer(marker);
      bounds.push(position.position);
    }

    map.addLayer(markers);
    if (0 < bounds.length) {
      map.fitBounds(bounds, {maxZoom: 15, padding: [40, 40]});
    }
  });
}
