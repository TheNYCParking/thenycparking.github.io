// app.js - uSpotly enhanced functions (based on uSpotly original code)

// --- Map init (USA/NYC) ---
// Inisialisasi Map
const map = L.map('map').setView([40.7128, -74.0060], 14); // default NYC

// Tile layer OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
}).addTo(map);

// Layer group untuk marker parkir (biar gampang di-reset)
const parkingLayer = L.layerGroup().addTo(map);

// Fungsi ambil bounding box dari map
function getBBox(map) {
  const bounds = map.getBounds();
  // format Socrata within_box(lat, lon, top, left, bottom, right)
  return `?$where=within_box(location, ${bounds.getNorth()}, ${bounds.getWest()}, ${bounds.getSouth()}, ${bounds.getEast()})`;
}

// Fungsi load data parkir NYC sesuai bounding box
async function loadParking() {
  const baseUrl = "https://data.cityofnewyork.us/resource/wya8-wim2.json";
  const bbox = getBBox(map);
  const url = `${baseUrl}${bbox}&$limit=1000`; // max 1000 per call

  try {
    const response = await fetch(url, {
      headers: {
        "X-App-Token": "ccstf8bnlrcg3y4wtjvpbbmzb" // token kamu
      }
    });
    const data = await response.json();

    // clear layer dulu sebelum nambah marker baru
    parkingLayer.clearLayers();

    // looping dataset
    data.forEach(item => {
      let lat = null, lon = null;

      // beberapa dataset pakai "latitude"/"longitude", ada juga "location" object
      if (item.latitude && item.longitude) {
        lat = parseFloat(item.latitude);
        lon = parseFloat(item.longitude);
      } else if (item.location && item.location.coordinates) {
        // Socrata GeoJSON → coordinates = [lon, lat]
        lon = item.location.coordinates[0];
        lat = item.location.coordinates[1];
      }

      if (lat && lon) {
        L.marker([lat, lon])
          .addTo(parkingLayer)
          .bindPopup(`
            <b>${item.name || "Parking Spot"}</b><br>
            ${item.address || "No address available"}
          `);
      }
    });

    console.log(`Loaded ${data.length} parking spots for current view`);

  } catch (err) {
    console.error("Error fetching parking data:", err);
  }
}

// Load pertama kali saat map dibuka
map.whenReady(() => {
  loadParking();
});

// Reload data tiap kali user geser / zoom map
map.on("moveend", () => {
  loadParking();
});

// --- My Location button ---
function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Tambahkan marker "You are here"
      L.marker([lat, lon], { icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [32, 32]
      }) })
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      // Geser map ke posisi user
      map.setView([lat, lon], 16);
    },
    (err) => {
      console.error("Geolocation error:", err);
      alert("Tidak bisa mendeteksi lokasi kamu");
    }
  );
}

// Tombol header
document.getElementById("btn-position").addEventListener("click", locateUser);
document.getElementById("btn-vacation").addEventListener("click", () => {
  alert("Vacation mode belum diimplementasikan 🚧");
});
document.getElementById("btn-donation").addEventListener("click", () => {
  window.open("https://buymeacoffee.com", "_blank");
});
