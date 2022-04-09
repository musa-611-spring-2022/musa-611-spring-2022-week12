/* globals Papa */

const map = L.map('map').setView([39.95, -75.16], 16);

L.tileLayer('https://api.mapbox.com/styles/v1/mjumbe-test/cl0r2nu2q000s14q9vfkkdsfr/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wwb3BudmZ3MWdyMjNkbzM1c2NrMGQwbSJ9.2ATDPobUwpa7Ou5jsJOGYA', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const neighborList = document.querySelector('.neighbors ul');
const neighborMarkers = {};
const neighborMarkerGroup = L.layerGroup().addTo(map);
const mapboxApiToken = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wxMTRseWx0MTdibzNrcnR1ZWJ5bm82NCJ9.besymahDw7d4y5NxD38URQ';
const precinct = '3927';

const showNeighborMarker = function (marker) {
  neighborMarkerGroup.clearLayers();
  neighborMarkerGroup.addLayer(marker);
  const latlng = marker.getBounds()._southWest;
  map.panTo(latlng);
}

const handleNeighborListItemClick = function () {
  const neighborListItem = this;
  const voterID = neighborListItem.dataset.voterID;
  const address = neighborListItem.dataset.address;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${mapboxApiToken}`;

  if (voterID in neighborMarkers) {
    const marker = neighborMarkers[voterID];
    showNeighborMarker(marker);
  } else {
    fetch(url)
      .then(resp => resp.json())
      .then(geocoderData => {
        const feature = geocoderData.features[0];
        const marker = L.geoJSON(feature);
        showNeighborMarker(marker);
      });
  }
}

const updateNeighborList = function(data) {
  neighborList.innerHTML = '';

  data.forEach(neighbor => {
    const voterID = neighbor['ID Number'];

    const firstName = neighbor['First Name'];
    const middleName = neighbor['Middle Name'];
    const lastName = neighbor['Last Name'];

    const houseNum = neighbor['House Number'];
    const streetName = neighbor['Street Name'];
    const city = 'Philadelphia';
    const state = 'PA';
    const zip = '19148';
    const address = `${houseNum} ${streetName}, ${city}, ${state} ${zip}`;

    const neighborListItem = htmlToElement(`
      <li>
        ${firstName} ${middleName} ${lastName}<br>
        ${address}
      </li>
    `);
    neighborListItem.dataset.address = address;
    neighborListItem.dataset.voterID = voterID;
    neighborList.appendChild(neighborListItem);

    neighborListItem.addEventListener('click', handleNeighborListItemClick);
  });
}

fetch(`https://mjumbewu-musa_static_file_server.storage.googleapis.com/phila_voter_exports_20220307/precinct${precinct}.csv`)
  .then(resp => resp.text())
  .then(text => {
    const { data } = Papa.parse(text, { header: true });
    updateNeighborList(data);
  });






///
