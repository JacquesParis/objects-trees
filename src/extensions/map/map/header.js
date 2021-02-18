// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function displayMap(id) {
  // eslint-disable-next-line no-undef
  await loadStyle('/leaflet/leaflet.css');
  // eslint-disable-next-line no-undef
  await loadScript('/leaflet/leaflet.js');

  // eslint-disable-next-line no-undef
  window.setTimeout(() => {
    const mymap = L.map(id).setView([51.505, -0.09], 13);

    const osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      // LIGNE 20
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    mymap.addLayer(osmLayer);

    const marker = L.marker([51.5, -0.09]).addTo(mymap);
    const circle = L.circle([51.508, -0.11], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500,
    }).addTo(mymap);
    const polygon = L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047],
    ]).addTo(mymap);
    marker.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();
    circle.bindPopup('I am a circle.');
    polygon.bindPopup('I am a polygon.');
    const popup = L.popup()
      .setLatLng([51.5, -0.09])
      .setContent('I am a standalone popup.')
      .openOn(mymap);
  });
}
