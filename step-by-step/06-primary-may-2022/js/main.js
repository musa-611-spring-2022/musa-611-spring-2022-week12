/* globals Papa */

const map = L.map('map', {maxZoom: 22}).setView([39.925, -75.159], 16);

L.tileLayer('https://api.mapbox.com/styles/v1/mjumbe-test/cl0r2nu2q000s14q9vfkkdsfr/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wwb3BudmZ3MWdyMjNkbzM1c2NrMGQwbSJ9.2ATDPobUwpa7Ou5jsJOGYA', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 22
}).addTo(map);

const precinctInput = document.querySelector('#precinct-filter');
const recencyInput = document.querySelector('#recency-filter');
const partySelect = document.querySelector('#party-filter');
const filteredCountSpan = document.querySelector('#filtered-count');
const filteredPrecinctSpan = document.querySelector('#filtered-precinct');
const neighborList = document.querySelector('.neighbors ul');

let neighborMarkers = {};
let neighborListItems = {};

const neighborMarkerGroup = L.layerGroup().addTo(map);
const mapboxApiToken = 'pk.eyJ1IjoibWp1bWJlLXRlc3QiLCJhIjoiY2wxMTRseWx0MTdibzNrcnR1ZWJ5bm82NCJ9.besymahDw7d4y5NxD38URQ';

const showNeighborMarker = function (marker) {
  const latlng = marker.getBounds()._southWest;
  map.panTo(latlng);
}

const handleNeighborListItemClick = function () {
  const neighborListItem = this;
  const neighborID = neighborListItem.dataset.neighborID;
  const address = neighborListItem.dataset.address;
  const lng = neighborListItem.dataset.longitude;
  const lat = neighborListItem.dataset.latitude;

  const marker = neighborMarkers[neighborID];
  if (marker) {
    showNeighborMarker(marker);
  }
}

const initNeighborListItems = function (data) {
  neighborListItems = {};
  neighborMarkerGroup.clearLayers();

  data.forEach(neighbor => {
    const neighborID = neighbor['Street Address'];
    const address = neighbor['Street Address'];

    const names = [];
    for (const resident of neighbor['Residents']) {
      const firstName = resident['First Name'];
      const middleName = resident['Middle Name'];
      const lastName = resident['Last Name'];

      names.push(`${firstName} ${middleName} ${lastName}`)
    }

    const lastVote = neighbor['Latest Vote Date'];
    const lng = neighbor['Longitude'];
    const lat = neighbor['Latitude'];

    const neighborListItem = htmlToElement(`
      <li class="neighbor">
        <span class="name">${names.join(', ')}</span>
        <span class="address">${address}</span>
        <span class="last-vote-date"><time value="${lastVote}">${lastVote || '(unknown last vote date)'}</time></span>
      </li>
    `);
    neighborListItem.dataset.address = address;
    neighborListItem.dataset.neighborID = neighborID;
    neighborListItem.dataset.longitude = lng || '';
    neighborListItem.dataset.latitude = lat || '';
    neighborListItem.addEventListener('click', handleNeighborListItemClick);

    if (lat && lng) {
      neighborMarkers[neighborID] = L.marker([lat, lng]).bindPopup(`${address}<br>${names.join(', ')}<br>${lastVote || '(unknown last vote date)'}`);
      neighborMarkerGroup.addLayer(neighborMarkers[neighborID]);
    }
    neighborListItems[neighborID] = neighborListItem;
  });
}

const getNeighborListItem = function (neighborID) {
  return neighborListItems[neighborID];
}

const updateNeighborList = function(data) {
  neighborList.innerHTML = '';

  data.forEach(neighbor => {
    const neighborListItem = getNeighborListItem(neighbor['Street Address']);
    neighborList.appendChild(neighborListItem);
  });

  filteredCountSpan.innerHTML = data.length;
}

const filterNeighborsData = function(data) {
  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  const recency = recencyInput.value;
  const party = partySelect.value;

  return data.filter(neighbor => {
    let lastVoteDate;

    if (neighbor['Last Vote Date']) {
      const voteDateComponents = datePattern.exec(neighbor['Last Vote Date']);
      const [, month, day, year] = voteDateComponents;
      lastVoteDate = `${year}-${month}-${day}`;
    }
    const neighborParty = neighbor['Party Code'];

    return (
      (!recency || lastVoteDate >= recency) &&
      (!party || neighborParty === party)
    );
  })
}

const showPrecinct = function (precinct) {
  fetch(`../../canvass/data/precinct${precinct}_geocoded_addresses.json`)
    .then(resp => {
      if (resp.status === 404) {
        alert(`No precinct "${precinct}" is available.`)
        throw new Error(`No data file for precinct "${precinct}"`)
      }
      return resp
    })
    .then(resp => resp.json())
    .then(data => {
      neighborsData = data;

      initNeighborListItems(neighborsData);
      filteredPrecinctSpan.innerHTML = precinct;
      const filteredData = filterNeighborsData(neighborsData);
      updateNeighborList(filteredData);
    });
}

const initPoliticalPartyOptions = function () {
  for (const party of politicalParties) {
    const partyOption = htmlToElement(`<option value="${party.code}">${party.name}</option>`);
    partySelect.appendChild(partyOption);
  }
}

handlePrecinctFilterChange = function () {
  const precinct = precinctInput.value;
  showPrecinct(precinct);
}

handleRecencyFilterChange = function () {
  const filteredNeighbors = filterNeighborsData(neighborsData);
  updateNeighborList(filteredNeighbors);
}

handlePartyFilterChange = function () {
  const filteredNeighbors = filterNeighborsData(neighborsData);
  updateNeighborList(filteredNeighbors);
}

initPoliticalPartyOptions();
showPrecinct(3927);
precinctInput.addEventListener('change', handlePrecinctFilterChange);
recencyInput.addEventListener('change', handleRecencyFilterChange);
partySelect.addEventListener('change', handlePartyFilterChange);






///
