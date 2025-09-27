const map = L.map('map').setView([40.7128,-74.0060],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

let userMarker, nearestMarker;

function locateUser(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude,longitude}=pos.coords;
      if(userMarker) map.removeLayer(userMarker);
      userMarker = L.circleMarker([latitude,longitude],{
        radius:10,color:'#0ff',fillColor:'#0ff',fillOpacity:0.8
      }).addTo(map).bindPopup("📍 You are here").openPopup();
      map.setView([latitude,longitude],16);
    }, err=>alert("❌ Location error: "+err.message));
  }
}

async function showNearest(){
  if(!userMarker){ alert("Enable My Location first."); return; }
  const userLatLng = userMarker.getLatLng();
  try{
    const res = await fetch("https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200");
    const data = await res.json();
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
      nearestMarker=L.circleMarker([nearest.lat,nearest.lng],{
        radius:10,color:'#f00',fillColor:'#f00',fillOpacity:0.8
      }).addTo(map).bindPopup(`🚗 Rule: ${nearest.rule}`).openPopup();
      map.setView([nearest.lat,nearest.lng],17);
    }
  } catch(e){ alert("⚠️ Data fetch error"); }
}

// theme toggle
const themeBtn=document.getElementById("themeToggle");
themeBtn.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
});
