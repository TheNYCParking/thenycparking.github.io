/* app.js — Final uSpotly (NYC) */

/* ---------- CONFIG ---------- */
const APP_TOKEN = "ccstf8bnlrcg3y4wtjvpbbmzb"; // replace if you need another token
const DATASET_URL = "https://data.cityofnewyork.us/resource/dv6r-f4he.json";
const DEFAULT_CENTER = [40.7128, -74.0060]; // Manhattan
const DEFAULT_ZOOM = 13;
const NEAREST_RADIUS_METERS = 500; // search radius for "Nearest Parking"

/* NYC bounds (approximate) */
const NYC_BOUNDS = L.latLngBounds([40.4774, -74.2591], [40.9176, -73.7004]);

/* ---------- MAP INIT ---------- */
const map = L.map('map', { preferCanvas: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

/* ---------- STATE ---------- */
let parkingLayer = L.layerGroup().addTo(map);
let userMarker = null;
let nearestMarker = null;
let isUserInNY = false; // flag set after geolocation check

/* ---------- UTILS ---------- */

// Safe parse float
function toFloat(v){ return v === undefined ? null : parseFloat(v); }

// Rule interpretation (returns allowed boolean and reason)
function isParkingAllowed(ruleText, date = new Date()){
  const dayNames = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const nowDay = dayNames[date.getDay()];
  const nowHour = date.getHours() + date.getMinutes()/60;

  if(!ruleText) return { allowed: true, reason: "No rule text" };
  const text = ruleText.toUpperCase();

  if(text.includes("ANYTIME") && (text.includes("NO PARKING") || text.includes("NO STANDING"))){
    return { allowed: false, reason: "No parking anytime" };
  }

  // look for day-specific NO PARKING with times
  const dayMatch = dayNames.find(d => text.includes(d));
  if(dayMatch && text.includes("NO PARKING")){
    const tm = text.match(/(\d{1,2})(AM|PM)-(\d{1,2})(AM|PM)/);
    if(tm){
      let [,h1,p1,h2,p2] = tm;
      h1 = (parseInt(h1)%12) + (p1==="PM"?12:0);
      h2 = (parseInt(h2)%12) + (p2==="PM"?12:0);
      if(nowDay === dayMatch && nowHour >= h1 && nowHour < h2){
        return { allowed: false, reason: `No parking ${dayMatch} ${h1}${p1}-${h2}${p2}` };
      }
    }
  }

  // fallback: assume allowed
  return { allowed: true, reason: "No restriction at this time" };
}

// Check whether lat/lng inside NYC_BOUNDS
function isInsideNYC(lat, lng){
  return NYC_BOUNDS.contains([lat, lng]);
}

/* ---------- MARKER HELPERS ---------- */

function addParkingMarker(lat, lng, ruleText){
  const check = isParkingAllowed(ruleText);
  const className = check.allowed ? 'marker-allowed' : 'marker-restricted';
  const marker = L.circleMarker([lat, lng], {
    radius: 9,
    weight: 2,
    className: className,
    fillOpacity: 0.95
  });

  const popupHtml = `
    <div style="font-size:14px;line-height:1.3">
      <b>🚗 Parking Rule</b><br/>
      ${ruleText ? escapeHtml(ruleText) : 'No description'}<br/>
      <small>${check.allowed ? '✅ Allowed' : '❌ Not Allowed'}</small><br/>
    </div>
  `;
  marker.bindPopup(popupHtml);
  marker.addTo(parkingLayer);
  return marker;
}

function setUserMarker(lat, lng){
  if(userMarker) map.removeLayer(userMarker);
  userMarker = L.circleMarker([lat, lng], {
    radius: 10,
    weight: 2,
    className: 'marker-user',
    fillOpacity: 1
  }).addTo(map).bindPopup("<b>📍 You are here</b>").openPopup();
}

function setNearestMarker(lat, lng, popupHtml){
  if(nearestMarker){
    map.removeLayer(nearestMarker);
    nearestMarker = null;
  }
  nearestMarker = L.circleMarker([lat, lng], {
    radius: 12,
    weight: 2,
    className: 'marker-nearest',
    fillOpacity: 1
  }).addTo(map).bindPopup(popupHtml).openPopup();

  // ensure it's visible
  map.setView([lat, lng], Math.max(map.getZoom(), 16));
}

/* ---------- HTML ESCAPE ---------- */
function escapeHtml(s){
  if(!s) return s;
  return s.replace(/[&<>"'`]/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;", "`":"&#x60;"}[m]);
  });
}

/* ---------- DATA LOADING ---------- */

// Load parking data for current viewport (bounding box)
async function loadParkingInView(){
  try {
    const b = map.getBounds();
    // Socrata query: latitude between south and north AND longitude between west and east
    const where = `latitude between ${b.getSouth()} and ${b.getNorth()} AND longitude between ${b.getWest()} and ${b.getEast()}`;
    const url = `${DATASET_URL}?$limit=1000&$where=${encodeURIComponent(where)}`;

    const res = await fetch(url, { headers: { "X-App-Token": APP_TOKEN } });
    if(!res.ok) throw new Error('Dataset fetch failed: ' + res.status);
    const data = await res.json();

    // clear previous parking markers
    parkingLayer.clearLayers();

    data.forEach(item => {
      const lat = toFloat(item.latitude) ?? (item.location && item.location.coordinates ? item.location.coordinates[1] : null);
      const lng = toFloat(item.longitude) ?? (item.location && item.location.coordinates ? item.location.coordinates[0] : null);
      if(lat && lng){
        addParkingMarker(lat, lng, item.sign_description || item.sign_text || item.description);
      }
    });
  } catch(err){
    console.error("Error loading parking in view:", err);
  }
}

// Load parking within a radius (meters) around a center lat/lng
// Uses Socrata within_circle(location, lat, lon, radius)
async function loadParkingAround(lat, lng, meters = NEAREST_RADIUS_METERS){
  try {
    const where = `within_circle(location, ${lat}, ${lng}, ${meters})`;
    const url = `${DATASET_URL}?$limit=500&$where=${encodeURIComponent(where)}`;

    const res = await fetch(url, { headers: { "X-App-Token": APP_TOKEN } });
    if(!res.ok) throw new Error('Dataset fetch failed: ' + res.status);
    const data = await res.json();
    return data.map(item => {
      const ilat = toFloat(item.latitude) ?? (item.location && item.location.coordinates ? item.location.coordinates[1] : null);
      const ilng = toFloat(item.longitude) ?? (item.location && item.location.coordinates ? item.location.coordinates[0] : null);
      return { raw: item, lat: ilat, lng: ilng, rule: item.sign_description || item.sign_text || item.description };
    }).filter(d => d.lat && d.lng);
  } catch(err){
    console.error("Error loading parking around:", err);
    return [];
  }
}

/* ---------- INTERACTIONS ---------- */

// Attempt auto-detect on first load.
// We will only use the location if permission granted and location is within NYC_BOUNDS.
// If position outside NYC, we will NOT treat them as NY user (isUserInNY=false).
function tryAutoDetectUser(){
  if(!navigator.geolocation) return;
  // Don't annoy users if browser blocks; attempt once
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if(isInsideNYC(lat, lng)){
      isUserInNY = true;
      setUserMarker(lat, lng);
      // load parking around user (500m) and ensure view centers on Manhattan default then user marker
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM); // keep default view but user marker is shown
    } else {
      isUserInNY = false;
      // do not set user marker (per B: non-NY should not auto detect), so remove if any
      if(userMarker){ map.removeLayer(userMarker); userMarker = null; }
    }
  }, err => {
    // user denied or error: do nothing (no auto-location)
    console.warn("Auto geolocation failed or denied:", err && err.message);
  }, { timeout: 8000, maximumAge: 5*60*1000 });
}

/* My Location button handler — explicit user action */
async function handleMyLocation(){
  if(!navigator.geolocation){
    alert("Geolocation is not supported by this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    // set flag based on whether user inside NYC
    if(isInsideNYC(lat, lng)) isUserInNY = true;
    else isUserInNY = false;

    setUserMarker(lat, lng);
    map.setView([lat, lng], 16);
    // After setting user marker, also load parking in view (so parking around user will show)
    loadParkingInView();
  }, err => {
    alert("Unable to retrieve your location. Permission denied or unavailable.");
  }, { enableHighAccuracy: true, timeout: 10000 });
}

/* Nearest Parking button handler */
async function handleNearestParking(){
  // If userMarker exists and user is outside NYC, block
  if(userMarker && !isUserInNY){
    alert("You cannot find nearest parking because you are outside New York State.");
    return;
  }

  // Determine search center: use map center (this allows user to pan to Bryant Park)
  const center = map.getCenter();
  if(!isInsideNYC(center.lat, center.lng)){
    alert("Nearest parking search works only inside New York City. Pan or zoom to NYC area.");
    return;
  }

  // load parking around center within NEAREST_RADIUS_METERS
  const candidates = await loadParkingAround(center.lat, center.lng, NEAREST_RADIUS_METERS);

  if(!candidates || candidates.length === 0){
    alert("No parking spots found within 500 meters of this view center.");
    return;
  }

  // find the closest candidate to center (Haversine not necessary — use Leaflet distance)
  let nearest = null;
  let minDist = Infinity;
  candidates.forEach(c => {
    const dist = map.distance([center.lat, center.lng], [c.lat, c.lng]);
    if(dist < minDist){ minDist = dist; nearest = c; }
  });

  if(nearest){
    // highlight nearest
    const popupHtml = `<div style="font-size:14px"><b>⭐ Nearest Parking</b><br/>${escapeHtml(nearest.rule || 'No rule info')}<br/><small>${Math.round(minDist)} m away</small></div>`;
    setNearestMarker(nearest.lat, nearest.lng, popupHtml);

    // ensure nearest marker visually stands out
    // also add class on nearest marker element (circleMarker has a path element)
    // (CSS handles .marker-nearest animation)
  } else {
    alert("No nearest parking found.");
  }
}

/* ---------- EVENTS ---------- */

// Load parking on moveend (viewport changes)
map.on('moveend', () => {
  loadParkingInView();
});

// wire buttons that must exist in your HTML
// Buttons must have IDs: btnPosition, btnNearest
document.addEventListener('DOMContentLoaded', () => {
  const btnPos = document.getElementById('btnPosition') || document.querySelector('[data-action="locate"]') || document.querySelector('.btn.locate') || document.querySelector('button[onclick*="locateUser"]');
  const btnNearest = document.getElementById('btnNearest') || document.querySelector('[data-action="nearest"]') || document.querySelector('.btn.nearest') || document.querySelector('button[onclick*="showNearest"]');

  // If your markup uses different IDs, adapt — but we try common fallbacks.
  if(btnPos){
    btnPos.addEventListener('click', handleMyLocation);
  } else {
    console.warn("My Location button not found (expected id=btnPosition or data-action=locate).");
  }

  if(btnNearest){
    btnNearest.addEventListener('click', handleNearestParking);
  } else {
    console.warn("Nearest Parking button not found (expected id=btnNearest or data-action=nearest).");
  }
});

/* ---------- STARTUP ---------- */
// initial load of markers for default NYC view
loadParkingInView();
// attempt auto-detect user quietly (per A.1); if outside NYC it will not show marker
tryAutoDetectUser();
