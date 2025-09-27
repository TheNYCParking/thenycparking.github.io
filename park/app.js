const map = L.map('map').setView([40.7128,-74.0060],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

let userMarker, nearestMarker;

function locateUser(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude}=pos.coords;
      if(userMarker) map.removeLayer(userMarker);
      userMarker=L.circleMarker([latitude,longitude],{radius:12,color:'#0ff',fillColor:'#0ff',fillOpacity:0.8}).addTo(map)
        .bindPopup("📍 You are here").openPopup();
      map.setView([latitude,longitude],16);
    }, err=>{ alert("❌ Failed: "+err.message); });
  } else alert("❌ Geolocation not supported.");
}

async function showNearest(){
  if(!userMarker){ alert("📍 Enable My Location first."); return; }
  const userLatLng=userMarker.getLatLng();
  try{
    const res=await fetch("https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200");
    const data=await res.json();
    let nearest=null, minDist=Infinity;
    data.forEach(item=>{
      if(item.latitude && item.longitude){
        const lat=parseFloat(item.latitude), lng=parseFloat(item.longitude);
        const dist=userLatLng.distanceTo([lat,lng]);
        if(dist<minDist){ nearest={lat,lng,rule:item.sign_description}; minDist=dist; }
      }
    });
    if(nearest){
      if(nearestMarker) map.removeLayer(nearestMarker);
      nearestMarker=L.circleMarker([nearest.lat, nearest.lng],{radius:12,color:'#0f0',fillColor:'#0f0',fillOpacity:0.8}).addTo(map)
        .bindPopup(`🚗 Nearest Parking Rule:<br>${nearest.rule}`).openPopup();
      map.setView([nearest.lat,nearest.lng],17);
    } else alert("❌ No parking data nearby.");
  } catch(e){ alert("⚠️ Error fetching data."); }
}

// Dark Mode toggle
const toggleBtn=document.getElementById("themeToggle");
toggleBtn.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode",document.body.classList.contains("dark")?"1":"0");
});
if(localStorage.getItem("darkMode")==="1") document.body.classList.add("dark");

// Banner hide/show
const adBanner=document.getElementById("adBanner");
const showAdBtn=document.getElementById("showAdBtn");
function hideAd(){ adBanner.style.display="none"; showAdBtn.style.display="inline-block"; localStorage.setItem("adHidden","1"); }
function showAd(){ adBanner.style.display="flex"; showAdBtn.style.display="none"; localStorage.setItem("adHidden","0"); }
if(localStorage.getItem("adHidden")==="1") hideAd();

// Service Worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js")
    .then(()=>console.log("✅ SW Registered"))
    .catch(err=>console.error("SW fail:",err));
}
