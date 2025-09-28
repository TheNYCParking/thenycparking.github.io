// ==================== INIT MAP ====================
const nycCenter = [40.7128, -74.0060]; // Manhattan default
const map = L.map('map').setView(nycCenter, 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

let userMarker, nearestMarker, parkingLayer;
const NYC_BOUNDS = L.latLngBounds([40.4774, -74.2591], [40.9176, -73.7004]); // NYC boundary box

// ==================== HELPER FUNCTIONS ====================

// Cek apakah koordinat masih di NYC
function isInsideNYC(lat, lng) {
  return NYC_BOUNDS.contains([lat, lng]);
}

// Tambah marker parkir
function addParkingMarker(lat, lng, rule) {
  const marker = L.circleMarker([lat, lng], {
    radius: 8,
    color: '#007bff',
    fillColor: '#00c853',
    fillOpacity: 0.9
  }).addTo(parkingLayer);

  marker.bindPopup(`
    <b>🚗 Parking Rule</b><br>
    ${rule || "No rule info"}
  `);

  return marker;
}

// Load parking data untuk area yang tampil di layar
async function loadParkingData(bounds) {
  if (parkingLayer) map.removeLayer(parkingLayer);
  parkingLayer = L.layerGroup().addTo(map);

  try {
    const url = `https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200&
      $where=latitude between ${bounds.getSouth()} and ${bounds.getNorth()}
      AND longitude between ${bounds.getWest()} and ${bounds.getEast()}`;

    const res = await fetch(url);
    const data = await res.json();

    data.forEach(item => {
      if (item.latitude && item.longitude) {
        addParkingMarker(parseFloat(item.latitude), parseFloat(item.longitude), item.sign_description);
      }
    });
  } catch (e) {
    console.error("⚠️ Error loading parking data:", e);
  }
}

// ==================== MAIN FUNCTIONS ====================

// Detect lokasi user
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;

      if (userMarker) map.removeLayer(userMarker);

      userMarker = L.circleMarker([latitude, longitude], {
        radius: 10,
        color: '#ff0',
        fillColor: '#ff0',
        fillOpacity: 0.9
      }).addTo(map).bindPopup("📍 You are here").openPopup();

      map.setView([latitude, longitude], 16);

    }, err => alert("❌ Location error: " + err.message));
  } else {
    alert("❌ Geolocation not supported.");
  }
}

// Cari nearest parking
async function showNearest() {
  let center = map.getCenter();
  const isInNYC = isInsideNYC(center.lat, center.lng);

  // Jika user bukan di NYC (GPS luar NYC)
  if (userMarker) {
    const pos = userMarker.getLatLng();
    if (!isInsideNYC(pos.lat, pos.lng)) {
      alert("❌ You cannot find nearest parking because you are outside New York State.");
      return;
    }
  }

  try {
    const url = `https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200&
      $where=latitude between ${center.lat - 0.01} and ${center.lat + 0.01}
      AND longitude between ${center.lng - 0.01} and ${center.lng + 0.01}`;

    const res = await fetch(url);
    const data = await res.json();

    let nearest = null, minDist = Infinity;
    data.forEach(item => {
      if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude), lng = parseFloat(item.longitude);
        const dist = center.distanceTo([lat, lng]);
        if (dist < minDist) {
          nearest = { lat, lng, rule: item.sign_description };
          minDist = dist;
        }
      }
    });

    if (nearest) {
      if (nearestMarker) map.removeLayer(nearestMarker);
      nearestMarker = L.circleMarker([nearest.lat, nearest.lng], {
        radius: 12,
        color: '#f00',
        fillColor: '#f00',
        fillOpacity: 0.9
      }).addTo(map)
        .bindPopup(`
          <b>🚗 Nearest Parking</b><br>
          ${nearest.rule || "No rule info"}<br>
          📍 (${nearest.lat.toFixed(5)}, ${nearest.lng.toFixed(5)})
        `).openPopup();

      map.setView([nearest.lat, nearest.lng], 17);
    } else {
      alert("❌ No parking data nearby.");
    }

  } catch (e) {
    alert("⚠️ Error fetching parking data.");
  }
}

// ==================== EVENT LISTENERS ====================
map.on("moveend", () => {
  loadParkingData(map.getBounds());
});

// Load awal data Manhattan
loadParkingData(map.getBounds());
