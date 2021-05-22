// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function displayMap(id, display) {
  // eslint-disable-next-line no-undef
  await loadStyle('/popup/popup.css');
  // eslint-disable-next-line no-undef
  await loadStyle('/leaflet/leaflet.css');
  // eslint-disable-next-line no-undef
  await loadScript('/leaflet/leaflet.js');

  // eslint-disable-next-line no-undef
  await loadStyle('/markercluster/MarkerCluster.css');
  // eslint-disable-next-line no-undef
  await loadStyle('/markercluster/MarkerCluster.Default.css');
  // eslint-disable-next-line no-undef
  await loadScript('/markercluster/leaflet.markercluster.js');

  // eslint-disable-next-line no-undef
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
        // eslint-disable-next-line no-undef
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
