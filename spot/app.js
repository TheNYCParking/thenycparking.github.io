// Inisialisasi map di NYC (Manhattan)
const map = L.map('map').setView([40.7128, -74.0060], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

let userMarker, nearestMarker;
let parkingLayer = L.layerGroup().addTo(map);

// --- Rule Interpretation Engine ---
function isParkingAllowed(ruleText, date = new Date()) {
  const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const nowDay = dayNames[date.getDay()];
  const nowHour = date.getHours() + date.getMinutes() / 60;

  if (!ruleText) return { allowed: true, reason: "No rule data" };
  const text = ruleText.toUpperCase();

  if (text.includes("ANYTIME") && (text.includes("NO PARKING") || text.includes("NO STANDING"))) {
    return { allowed: false, reason: "No parking anytime" };
  }

  const dayMatch = dayNames.find(d => text.includes(d));
  if (dayMatch && text.includes("NO PARKING")) {
    const timeMatch = text.match(/(\d{1,2})(AM|PM)-(\d{1,2})(AM|PM)/);
    if (timeMatch) {
      let [, h1, p1, h2, p2] = timeMatch;
      h1 = parseInt(h1) % 12 + (p1 === "PM" ? 12 : 0);
      h2 = parseInt(h2) % 12 + (p2 === "PM" ? 12 : 0);
      if (nowDay === dayMatch && nowHour >= h1 && nowHour < h2) {
        return { allowed: false, reason: `No parking ${dayMatch} ${h1}${p1}-${h2}${p2}` };
      }
    }
  }

  return { allowed: true, reason: "No restriction at this time" };
}

// --- Load Parking Data in Current Map View ---
async function loadParkingData() {
  const bounds = map.getBounds();
  const query = `?$limit=200&$where=latitude between ${bounds.getSouth()} and ${bounds.getNorth()} AND longitude between ${bounds.getWest()} and ${bounds.getEast()}`;
  const url = `https://data.cityofnewyork.us/resource/dv6r-f4he.json${query}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    parkingLayer.clearLayers();
    data.forEach(item => {
      if (item.latitude && item.longitude) {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        const rule = item.sign_description;
        const ruleCheck = isParkingAllowed(rule);

        const color = ruleCheck.allowed ? "green" : "red";

        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          color: color,
          fillColor: color,
          fillOpacity: 0.8
        }).bindPopup(`
          🚗 Parking Rule:<br>${rule || "No description"}<br>
          ⏱️ Status: ${ruleCheck.allowed ? "✅ Allowed" : "❌ Not Allowed"}<br>
          ℹ️ ${ruleCheck.reason}
        `);

        parkingLayer.addLayer(marker);
      }
    });

  } catch (e) {
    console.error("⚠️ Error fetching parking data", e);
  }
}

// --- Locate User ---
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      if (userMarker) map.removeLayer(userMarker);

      userMarker = L.circleMarker([latitude, longitude], {
        radius: 10, color: '#0ff', fillColor: '#0ff', fillOpacity: 0.8
      }).addTo(map).bindPopup("📍 You are here").openPopup();

      map.setView([latitude, longitude], 16);
      showNearest();
    }, err => {
      alert("❌ Location error: " + err.message);
    });
  } else {
    alert("❌ Geolocation not supported.");
  }
}

// --- Find Nearest Parking to User ---
async function showNearest() {
  if (!userMarker) {
    alert("📍 Enable My Location first.");
    return;
  }
  const userLatLng = userMarker.getLatLng();
  let nearest = null, minDist = Infinity;

  parkingLayer.eachLayer(marker => {
    const dist = userLatLng.distanceTo(marker.getLatLng());
    if (dist < minDist) {
      minDist = dist;
      nearest = marker;
    }
  });

  if (nearest) {
    if (nearestMarker) map.removeLayer(nearestMarker);
    nearestMarker = L.circleMarker(nearest.getLatLng(), {
      radius: 12, color: '#00f', fillColor: '#00f', fillOpacity: 0.6
    }).addTo(map).bindPopup("⭐ Nearest Parking Spot").openPopup();
    map.setView(nearest.getLatLng(), 17);
  } else {
    alert("❌ No parking spots nearby.");
  }
}

// Load parking data whenever map stops moving
map.on("moveend", loadParkingData);

// Load initial parking data
loadParkingData();
