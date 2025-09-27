// app.js - uSpotly enhanced functions (based on uSpotly original code)

// --- Map init (USA/NYC) ---
const map = L.map('map').setView([40.7128,-74.0060], 14); // default Manhattan
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let userMarker;
let parkingLayer = L.layerGroup().addTo(map);

// 🔹 Fungsi untuk load data parkir dalam bounds layar map
async function loadParkingData() {
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const url = `https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200&$where=latitude BETWEEN ${sw.lat} AND ${ne.lat} AND longitude BETWEEN ${sw.lng} AND ${ne.lng}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    parkingLayer.clearLayers(); // bersihkan sebelum tambah data baru

    data.forEach(item => {
      if (item.latitude && item.longitude) {
        L.circleMarker([item.latitude, item.longitude], {
          radius: 6,
          color: '#007bff',
          fillColor: '#00aaff',
          fillOpacity: 0.6
        }).bindPopup(item.sign_description || "Parking spot").addTo(parkingLayer);
      }
    });

  } catch (e) {
    console.error("⚠️ Parking fetch error", e);
  }
}

// 🔹 Fungsi locate user
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([latitude, longitude], {
        radius: 10, color: '#0ff', fillColor: '#0ff', fillOpacity: 0.8
      }).addTo(map).bindPopup("📍 You are here").openPopup();
      map.setView([latitude, longitude], 16);
      loadParkingData(); // tampilkan data parkir area user
    }, err => alert("❌ Location error: " + err.message));
  }
}

// 🔹 Event: setiap map digeser/zoom → load ulang data parkir
map.on('moveend', loadParkingData);

// 🔹 Load pertama kali saat buka app
loadParkingData();

// 🔹 Dark mode toggle (opsional)
const themeBtn = document.getElementById("themeToggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}
