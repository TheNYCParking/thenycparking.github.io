// --- Map & Parking Logic ---
let userMarker, nearestMarker;
const map=L.map('map').setView([40.7128,-74.0060],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

function isParkingAllowed(ruleText, date=new Date()){
  const dayNames=["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const nowDay=dayNames[date.getDay()];
  const nowHour=date.getHours()+date.getMinutes()/60;
  if(!ruleText) return {allowed:true, reason:"No rule data"};
  const text=ruleText.toUpperCase();
  if(text.includes("ANYTIME")&&(text.includes("NO PARKING")||text.includes("NO STANDING"))) 
    return {allowed:false, reason:"No parking anytime"};
  const dayMatch=dayNames.find(d=>text.includes(d));
  if(dayMatch&&text.includes("NO PARKING")){
    const timeMatch=text.match(/(\d{1,2})(AM|PM)-(\d{1,2})(AM|PM)/);
    if(timeMatch){
      let [,h1,p1,h2,p2]=timeMatch;
      h1=parseInt(h1)%12+(p1==="PM"?12:0); h2=parseInt(h2)%12+(p2==="PM"?12:0);
      if(nowDay===dayMatch && nowHour>=h1 && nowHour<h2) return {allowed:false, reason:`No parking ${dayMatch} ${h1}${p1}-${h2}${p2}`};
    }
  }
  if(text.includes("PARKING")&&text.match(/\d ?HR/)){
    const timeMatch=text.match(/(\d{1,2})(AM|PM)-(\d{1,2})(AM|PM)/);
    if(timeMatch){
      let [,h1,p1,h2,p2]=timeMatch;
      h1=parseInt(h1)%12+(p1==="PM"?12:0); h2=parseInt(h2)%12+(p2==="PM"?12:0);
      if(!(text.includes("EXCEPT "+nowDay)) && nowHour>=h1 && nowHour<h2) return {allowed:true, reason:`Allowed max ${text.match(/\d ?HR/)[0]} until ${h2}${p2}`};
    }
  }
  return {allowed:true, reason:"No restriction at this time"};
}

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
      const ruleCheck=isParkingAllowed(nearest.rule);
      const color = ruleCheck.allowed?"#0f0":"#f00";
      nearestMarker=L.circleMarker([nearest.lat, nearest.lng],{
        radius:12, color:color, fillColor:color, fillOpacity:0.8, weight:3
      }).addTo(map).bindPopup(`🚗 Nearest Parking Rule:<br>${nearest.rule}<br>⏱️ Status: ${ruleCheck.allowed?"✅ Allowed":"❌ Not Allowed"}<br>ℹ️ ${ruleCheck.reason}`).openPopup();

      let pulse=0;
      setInterval(()=>{ pulse=(pulse+0.1)%1; nearestMarker.setStyle({radius:12+4*Math.sin(pulse*6.28)}); },50);

      map.setView([nearest.lat,nearest.lng],17);
    } else alert("❌ No parking data nearby.");
  } catch(e){ alert("⚠️ Error fetching data."); }
}

// Dark Mode toggle
document.getElementById("themeToggle").addEventListener("click",()=>{
  document.body.classList.toggle("dark");
});
if(localStorage.getItem("darkMode")==="1") document.body.classList.add("dark");

// --- Footer Ads ---
function hideSingle(btn){ btn.parentElement.style.display='none'; }
function hideAllAds(){
  document.querySelectorAll('.ad-banner').forEach(b=>b.style.display='none');
  document.getElementById('showAdBtn').style.display='inline-block';
  localStorage.setItem("adHidden","1");
}
function showAllAds(){
  document.querySelectorAll('.ad-banner').forEach(b=>b.style.display='flex');
  document.getElementById('showAdBtn').style.display='none';
  localStorage.setItem("adHidden","0");
}
if(localStorage.getItem("adHidden")==="1") hideAllAds();

// Service Worker
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("/sw.js")
    .then(()=>console.log("✅ SW Registered"))
    .catch(err=>console.error("SW fail:",err));
}
