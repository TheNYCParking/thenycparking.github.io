// === INIT MAP ===
const map = L.map('map').setView([40.7128, -74.0060], 13); // Default NYC
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let userLatLng = null;
let userMarker = null;
let userCircle = null;
let parkingMarkers = [];

// === Load Parking Data (NYC Open Data) ===
async function loadParkingData() {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const url = `https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200&$where=latitude between ${sw.lat} and ${ne.lat} AND longitude between ${sw.lng} and ${ne.lng}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    // Bersihkan marker lama
    parkingMarkers.forEach(m => map.removeLayer(m));
    parkingMarkers = [];

    // Tambahkan marker baru
    data.forEach(item => {
      if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);

        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: '#ff6600',
          fillColor: '#ff6600',
          fillOpacity: 0.8
        }).addTo(map).bindPopup(`🚗 Rule: ${item.sign_description || "Parking Rule"}`);

        parkingMarkers.push(marker);
      }
    });
  } catch (e) {
    console.error("⚠️ Parking data error:", e);
  }
}

// Panggil saat awal dan setiap view map berubah
map.on("moveend", loadParkingData);
loadParkingData();


// === My Location (Position Button) ===
document.getElementById("btn-position").addEventListener("click", () => {
  if (navigator.geolocation) {
    map.locate({ setView: true, maxZoom: 17 });
  } else {
    alert("❌ Geolocation tidak didukung browser ini.");
  }
});

map.on("locationfound", (e) => {
  userLatLng = e.latlng;
  const radius = e.accuracy / 2;

  if (userMarker) {
    map.removeLayer(userMarker);
    map.removeLayer(userCircle);
  }

  userMarker = L.marker(userLatLng).addTo(map)
    .bindPopup("📍 You are here").openPopup();
  userCircle = L.circle(userLatLng, radius).addTo(map);
});

map.on("locationerror", () => {
  alert("⚠️ Tidak bisa mendapatkan lokasi Anda. Aktifkan GPS & izinkan browser.");
});


// === Nearest Parking (Vacation Button) ===
document.getElementById("btn-vacation").addEventListener("click", () => {
  if (!userLatLng) {
    alert("Klik 'My Location' dulu supaya kita tahu posisi Anda.");
    return;
  }

  if (parkingMarkers.length === 0) {
    alert("⚠️ Data parkir belum tersedia.");
    return;
  }

  let nearestMarker = null;
  let nearestDistance = Infinity;

  parkingMarkers.forEach(marker => {
    const dist = map.distance(userLatLng, marker.getLatLng());
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestMarker = marker;
    }
  });

  if (nearestMarker) {
    map.setView(nearestMarker.getLatLng(), 18);
    nearestMarker.openPopup();
  } else {
    alert("🚫 Tidak ada parkir terdekat ditemukan.");
  }
});


// === Theme Toggle (optional if ada button theme) ===
const themeBtn = document.getElementById("themeToggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}
