// app.js - uSpotly enhanced functions (based on your original code)

// --- Map init (USA/NYC) ---
const map = L.map('map').setView([40.7128, -74.0060], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

let userMarker = null;
let nearestMarker = null;
let datasetCacheKey = 'uspotly-nyc-dataset-v1';
const nycDatasetUrl = "https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=5000"; // larger limit

// --- utilities ---
function safeText(s){ return s ? String(s) : ''; }

// Convert leaflet LatLng to simple array
function toLatLngArray(obj){ return [parseFloat(obj.latitude), parseFloat(obj.longitude)]; }

// --- locate user ---
function locateUser(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude} = pos.coords;
      if(userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([latitude,longitude],{radius:10, color:'#000', fillColor:'#000', fillOpacity:0.9}).addTo(map)
        .bindPopup("📍 You are here").openPopup();
      map.setView([latitude,longitude], 16);
    }, err => alert("❌ Location error: "+err.message));
  } else alert("❌ Geolocation not supported.");
}

// --- fetch dataset (with cache fallback) ---
async function fetchNYCDataset(){
  // First try network; cache response in Cache Storage and localStorage fallback
  try {
    const res = await fetch(nycDatasetUrl);
    if(!res.ok) throw new Error('Network response not ok');
    const json = await res.json();

    // store in localStorage (stringified, careful about size)
    try { localStorage.setItem(datasetCacheKey, JSON.stringify(json)); } catch(e){ /* ignore quota */ }

    // also store in Cache Storage (for SW/offline)
    if('caches' in window){
      caches.open('data-cache-v1').then(cache => cache.put(nycDatasetUrl, new Response(JSON.stringify(json))));
    }

    return json;
  } catch (err) {
    console.warn("Network fail, trying local cache:", err);
    // try Cache Storage
    if('caches' in window){
      try {
        const cache = await caches.open('data-cache-v1');
        const match = await cache.match(nycDatasetUrl);
        if(match){
          const txt = await match.text();
          return JSON.parse(txt);
        }
      } catch(e){ console.warn("Cache read fail:", e); }
    }
    // fallback to localStorage
    const stored = localStorage.getItem(datasetCacheKey);
    if(stored) return JSON.parse(stored);
    throw new Error('No data available offline');
  }
}

// --- filter helper ---
function matchesFilter(ruleText, filterValue){
  if(!filterValue || filterValue === 'all') return true;
  if(!ruleText) return false;
  return ruleText.toUpperCase().includes(filterValue);
}

// --- find nearest ---
async function showNearest(){
  if(!userMarker){ alert("Enable My Location first."); return; }
  const userLatLng = userMarker.getLatLng();
  try {
    const data = await fetchNYCDataset();
    let nearest = null, minDist = Infinity;
    const activeFilter = document.getElementById('filterSelect').value;

    data.forEach(item => {
      if(item.latitude && item.longitude){
        const lat = parseFloat(item.latitude), lng = parseFloat(item.longitude);
        const dist = userLatLng.distanceTo([lat, lng]);
        if(dist < minDist && matchesFilter(item.sign_description, activeFilter)){
          minDist = dist;
          nearest = { lat, lng, rule: item.sign_description || 'No description' };
        }
      }
    });
    if(!nearest){ alert("No parking data matching filter near you."); return; }

    if(nearestMarker) map.removeLayer(nearestMarker);
    nearestMarker = L.circleMarker([nearest.lat, nearest.lng], { radius: 10, color:'#b30000', fillColor:'#b30000', fillOpacity:0.9 })
      .addTo(map)
      .bindPopup(`🚗 Rule: ${safeText(nearest.rule)}<br><button onclick="setReminder(${nearest.lat},${nearest.lng}, ${JSON.stringify(safeText(nearest.rule))})">Set Reminder</button>`)
      .openPopup();
    map.setView([nearest.lat, nearest.lng], 17);
  } catch(e){
    alert("⚠️ Data fetch error: " + e.message);
  }
}

// --- address search (Nominatim) ---
async function searchAddress(q){
  if(!q) return;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
  try {
    const res = await fetch(url, {headers:{'Accept':'application/json'}});
    const json = await res.json();
    if(!json || json.length === 0){ alert("No results"); return; }
    const first = json[0];
    const lat = parseFloat(first.lat), lon = parseFloat(first.lon);
    map.setView([lat, lon], 15);
    L.marker([lat, lon]).addTo(map).bindPopup(`${first.display_name}`).openPopup();
  } catch(e){ alert("Search failed"); }
}

// --- reporting (store locally) ---
let reportingMode = false;
document.getElementById('reportBtn').addEventListener('click', ()=> {
  reportingMode = !reportingMode;
  document.getElementById('reportBtn').textContent = reportingMode ? 'Click map to report' : 'Report Spot';
  if(reportingMode){
    map.getContainer().style.cursor = 'crosshair';
  } else {
    map.getContainer().style.cursor = '';
  }
});

map.on('click', (e)=>{
  if(!reportingMode) return;
  const lat = e.latlng.lat, lng = e.latlng.lng;
  const note = prompt("Report: Describe spot (e.g. empty, occupied, permit only):", "empty");
  if(note === null) return; // cancelled
  const reports = JSON.parse(localStorage.getItem('uspotly-reports') || '[]');
  const rep = { lat, lng, note, time: Date.now() };
  reports.push(rep);
  localStorage.setItem('uspotly-reports', JSON.stringify(reports));
  L.marker([lat,lng], {opacity:0.9}).addTo(map).bindPopup(`Report: ${note}`);
  reportingMode = false;
  document.getElementById('reportBtn').textContent = 'Report Spot';
  map.getContainer().style.cursor = '';
  alert("Report saved locally.");
});

// --- show stored reports on load ---
function showStoredReports(){
  const reports = JSON.parse(localStorage.getItem('uspotly-reports') || '[]');
  reports.forEach(r => {
    L.circleMarker([r.lat, r.lng], { radius:6, color:'#ff8c00', fillColor:'#ff8c00', fillOpacity:0.9 })
      .addTo(map)
      .bindPopup(`Report: ${safeText(r.note)}<br><small>${new Date(r.time).toLocaleString()}</small>`);
  });
}

// --- reminders (local) ---
function setReminder(lat, lng, rule){
  const minutes = prompt("Reminder in how many minutes?", "30");
  if(!minutes) return;
  const ms = parseInt(minutes,10) * 60 * 1000;
  if(isNaN(ms)) { alert("Invalid number"); return; }
  const reminders = JSON.parse(localStorage.getItem('uspotly-reminders') || '[]');
  const r = { lat, lng, rule, at: Date.now() + ms };
  reminders.push(r);
  localStorage.setItem('uspotly-reminders', JSON.stringify(reminders));
  scheduleReminder(r);
  alert("Reminder set (will trigger while this page is open).");
}

function scheduleReminder(rem){
  const delay = rem.at - Date.now();
  if(delay <= 0) return;
  setTimeout(() => {
    // show notification if permitted
    if("Notification" in window && Notification.permission === "granted"){
      new Notification("uSpotly Reminder", { body: `Reminder for parking spot: ${rem.rule || 'spot'}` });
    } else {
      alert("Reminder: " + (rem.rule || 'parking spot'));
    }
  }, delay);
}

function loadAndScheduleReminders(){
  const reminders = JSON.parse(localStorage.getItem('uspotly-reminders') || '[]');
  reminders.forEach(r => scheduleReminder(r));
}

// --- search UI handlers ---
document.getElementById('searchBtn').addEventListener('click', ()=> {
  const q = document.getElementById('searchInput').value.trim();
  if(q) searchAddress(q);
});
document.getElementById('searchInput').addEventListener('keyup', (e)=>{
  if(e.key === 'Enter') document.getElementById('searchBtn').click();
});

// theme toggle
const themeBtn = document.getElementById('themeToggle');
themeBtn.addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark') ? 'Light' : 'Dark';
  localStorage.setItem('uspotly-dark', document.body.classList.contains('dark') ? '1' : '0');
});
if(localStorage.getItem('uspotly-dark') === '1'){
  document.body.classList.add('dark');
  themeBtn.textContent = 'Light';
}

// load reports & reminders on start
showStoredReports();
loadAndScheduleReminders();

// optionally register service worker is in sw.js registration if available
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js')
    .then(()=>console.log('SW registered'))
    .catch(e=>console.warn('SW reg fail', e));
}
