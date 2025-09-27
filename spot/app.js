// app.js

// Inisialisasi peta
const map = L.map('map').setView([40.7128, -74.0060], 14);

// Tile OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Marker Layer Group untuk parkir
const parkingLayer = L.layerGroup().addTo(map);

// Ikon custom 🚫 dan 🅿️
const noParkingIcon = L.divIcon({
  className: 'custom-icon',
  html: '🚫',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const yesParkingIcon = L.divIcon({
  className: 'custom-icon',
  html: '🅿️',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// API Socrata
const API_URL = "https://data.cityofnewyork.us/resource/nc67-uf89.json";
const APP_TOKEN = "ccstf8bnlrcg3y4wtjvpbbmzb"; // token dari akunmu

// Fungsi ambil data sesuai bounding box
async function loadParkingData() {
  parkingLayer.clearLayers();

  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const query = `$where=latitude between ${sw.lat} and ${ne.lat} AND longitude between ${sw.lng} and ${ne.lng} LIMIT 500`;

  try {
    const response = await fetch(`${API_URL}?${query}`, {
      headers: { "X-App-Token": APP_TOKEN }
    });
    const data = await response.json();

    if (data.length === 0) {
      console.log("Tidak ada data parkir di area ini.");
      return;
    }

    data.forEach(item => {
      if (!item.latitude || !item.longitude) return;

      // Deteksi apakah aturan = no parking atau bisa parkir
      const rule = (item.rule || "").toLowerCase();
      const isNoParking = rule.includes("no parking") || rule.includes("no standing");

      const marker = L.marker([item.latitude, item.longitude], {
        icon: isNoParking ? noParkingIcon : yesParkingIcon
      }).bindPopup(`
        <b>${isNoParking ? "🚫 No Parking" : "🅿️ Parking Allowed"}</b><br/>
        Rule: ${item.rule || "N/A"}<br/>
        Street: ${item.main_street || "Unknown"}<br/>
        From: ${item.from_street || "-"}<br/>
        To: ${item.to_street || "-"}
      `);

      parkingLayer.addLayer(marker);
    });

    console.log(`Loaded ${data.length} parking records.`);
  } catch (err) {
    console.error("Error loading parking data:", err);
  }
}

// Muat data pertama kali
loadParkingData();

// Update data saat map digeser/zoom
map.on('moveend', loadParkingData);
