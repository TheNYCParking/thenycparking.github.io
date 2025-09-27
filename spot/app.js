// app.js - uSpotly enhanced functions (based on uSpotly original code)

// --- Map init (USA/NYC) ---
const map = L.map('map').setView([40.7128, -74.0060], 14); // default Manhattan
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let userMarker, nearestMarker, parkingLayer;

// Socrata API
const API_URL = "https://data.cityofnewyork.us/resource/nfid-uabd.json";
const APP_TOKEN = "ccstf8bnlrcg3y4wtjvpbbmzb"; // dari kamu
const FETCH_LIMIT = 1000;

// --- Utility: ambil data sesuai bounding box layar ---
async function fetchParkingData(bounds) {
  const { _southWest, _northEast } = bounds;
  const where = `within_box(location, ${_northEast.lat}, ${_southWest.lng}, ${_southWest.lat}, ${_northEast.lng})`;

  const url = `${API_URL}?$limit=${FETCH_LIMIT}&$where=${where}`;
  const res = await fetch(url, {
    headers: { "X-App-Token": APP_TOKEN }
  });
  return res.json();
}

// --- Tampilkan regulasi parkir dalam layar map ---
async function showParkingInView() {
  try {
    if (parkingLayer) map.removeLayer(parkingLayer);
    const data = await fetchParkingData(map.getBounds());

    parkingLayer = L.layerGroup();
    data.forEach(item => {
      if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        const desc = item.sign_description || "No info";

        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: "#ff8800",
          fillColor: "#ff8800",
          fillOpacity: 0.7
        }).bindPopup(`🚗 Rule: ${desc}`);
        parkingLayer.addLayer(marker);
      }
    });

    parkingLayer.addTo(map);
  } catch (err) {
    console.error("⚠️ Fetch error:", err);
  }
}

// --- Geolocation: deteksi user ---
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) map.removeLayer(userMarker);

      userMarker = L.circleMarker([latitude, longitude], {
        radius: 10,
        color: '#0ff',
        fillColor: '#0ff',
        fillOpacity: 0.8
      }).addTo(map).bindPopup("📍 You are here").openPopup();

      map.setView([latitude, longitude], 16);
      showNearest(); // otomatis tunjukkan parkir terdekat
    }, err => alert("❌ Location error: " + err.message));
  }
}

// --- Cari parkir terdekat dari user ---
async function showNearest() {
  if (!userMarker) { alert("Enable My Location first."); return; }
  const userLatLng = userMarker.getLatLng();
  try {
    const data = await fetchParkingData(map.getBounds());
    let nearest = null, minDist = Infinity;

    data.forEach(item => {
      if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude), lng = parseFloat(item.longitude);
        const dist = userLatLng.distanceTo([lat, lng]);
        if (dist < minDist) {
          nearest = { lat, lng, rule: item.sign_description };
          minDist = dist;
        }
      }
    });

    if (nearest) {
      if (nearestMarker) map.removeLayer(nearestMarker);
      nearestMarker = L.circleMarker([nearest.lat, nearest.lng], {
        radius: 10, color: '#f00', fillColor: '#f00', fillOpacity: 0.8
      }).addTo(map).bindPopup(`🚗 Rule: ${nearest.rule}`).openPopup();
      map.setView([nearest.lat, nearest.lng], 17);
    }
  } catch (e) { alert("⚠️ Data fetch error"); }
}

// --- Event: update data saat map digerakkan ---
map.on("moveend", showParkingInView);

// --- Load pertama kali (NYC + regulasi default) ---
showParkingInView();
