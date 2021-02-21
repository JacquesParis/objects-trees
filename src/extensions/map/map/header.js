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
  });
}
