<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>uSpotly – Street Parking Finder USA</title>
  <meta name="description" content="Find legal street parking across the USA quickly and easily with uSpotly. Free, fast, futuristic, and mobile-ready.">
  <meta name="keywords" content="USA parking, street parking USA, parking rules, find parking, uSpotly, futuristic parking map">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
  <style>
    /* --- Colors & Theme --- */
    :root {
      --bg: #0a0a0f;
      --text: #f0f0f5;
      --accent: #0ff;
      --header-bg: rgba(10,10,15,0.85);
      --btn-bg: rgba(0,255,255,0.1);
      --btn-hover: rgba(0,255,255,0.25);
    }
    body { margin:0; font-family:"Orbitron",sans-serif; background: var(--bg); color: var(--text);}
    h1,h2 { color: var(--accent);}
    a { color: var(--accent); text-decoration:none; }
    a:hover { text-decoration:underline; }
    header { position:fixed; width:100%; top:0; display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:var(--header-bg); backdrop-filter: blur(8px); z-index:1000; }
    nav { display:flex; gap:10px; flex-wrap:wrap; }
    .btn {
      background: var(--btn-bg);
      color: var(--accent);
      border:none;
      padding:8px 16px;
      border-radius:12px;
      font-weight:600;
      cursor:pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 10px var(--accent);
    }
    .btn:hover {
      background: var(--btn-hover);
      transform: scale(1.05);
      box-shadow: 0 0 20px var(--accent);
    }
    #map { width:100%; height:calc(100vh - 70px); margin-top:70px; filter: drop-shadow(0 0 8px var(--accent)); border-radius:8px;}
    main { padding:20px; margin-top:20px; }
    .feature-card {
      background: rgba(20,20,30,0.6);
      backdrop-filter: blur(10px);
      border: 1px solid var(--accent);
      border-radius:16px;
      padding:16px;
      margin-bottom:16px;
      box-shadow: 0 0 20px rgba(0,255,255,0.2);
      transition: transform 0.3s;
    }
    .feature-card:hover { transform: translateY(-5px) scale(1.02); }
    footer { text-align:center; padding:10px; font-size:0.75rem; color:#888; background:rgba(10,10,15,0.85); backdrop-filter: blur(8px);}
  </style>
</head>
<body>
  <header>
    <h1>uSpotly</h1>
    <nav>
      <button class="btn" onclick="locateUser()">My Location</button>
      <button class="btn" onclick="showNearest()">Nearest Parking</button>
      <button class="btn" onclick="window.location.href='privacy.html'">Privacy</button>
      <button class="btn" onclick="window.location.href='features.html'">Features</button>
      <button class="btn" id="themeToggle">🌙 Dark</button>
    </nav>
  </header>

  <div id="map"></div>

  <main>
    <h2>Features & Benefits – Futuristic</h2>

    <div class="feature-card">
      <h3>Real-Time Location Awareness</h3>
      <p>Pinpoint your location instantly across USA cities and find nearest parking spots automatically.</p>
    </div>

    <div class="feature-card">
      <h3>Smart Parking Rule Interpretation</h3>
      <p>Readable rules from official signs, showing allowed times, restrictions, and exceptions in a futuristic interface.</p>
    </div>

    <div class="feature-card">
      <h3>Glowing Map Markers</h3>
      <p>Neon-colored markers indicate available or restricted parking, pulsing dynamically to grab attention.</p>
    </div>

    <div class="feature-card">
      <h3>Mobile-Ready & Lightweight</h3>
      <p>Designed as a fast-loading microsite with futuristic UI optimized for all devices.</p>
    </div>

    <div class="feature-card">
      <h3>Dark & Futuristic Theme</h3>
      <p>Enjoy night-friendly glowing interfaces with sleek animations and glassmorphism cards.</p>
    </div>

    <div class="feature-card">
      <h3>Completely Free</h3>
      <p>uSpotly is free for life, helping everyone in the USA find legal parking without any cost.</p>
    </div>

    <div class="feature-card">
      <h3>PWA & Offline Ready</h3>
      <p>Install uSpotly on your device, and core features work offline with service workers.</p>
    </div>
  </main>

  <footer>
    &copy; 2025 uSpotly – Street Parking Finder USA
  </footer>

  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([40.7128, -74.0060], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(map);

    let userMarker, nearestMarker;

    function locateUser() {
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(pos=>{
          const {latitude,longitude}=pos.coords;
          if(userMarker) map.removeLayer(userMarker);
          userMarker=L.marker([latitude,longitude],{icon:L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/512/684/684908.png',iconSize:[32,32]})})
            .addTo(map).bindPopup("📍 You are here").openPopup();
          map.setView([latitude,longitude],16);
        }, err=>alert("❌ Failed: "+err.message));
      } else alert("❌ Geolocation not supported.");
    }

    async function showNearest() {
      if(!userMarker){ alert("📍 Enable My Location first."); return; }
      const userLatLng=userMarker.getLatLng();
      try {
        const res=await fetch("https://data.cityofnewyork.us/resource/dv6r-f4he.json?$limit=200");
        const data=await res.json();
        let nearest=null, minDist=Infinity;
        data.forEach(item=>{
          if(item.latitude && item.longitude){
            const lat=parseFloat(item.latitude), lng=parseFloat(item.longitude);
            const dist=userLatLng.distanceTo([lat,lng]);
            if(dist<minDist){ minDist=dist; nearest={lat,lng,rule:item.sign_description}; minDist=dist; }
          }
        });
        if(nearest){
          if(nearestMarker) map.removeLayer(nearestMarker);
          nearestMarker=L.circleMarker([nearest.lat,nearest.lng],{
            radius:10, color:'#0ff', fillColor:'#0ff', fillOpacity:0.8
          }).addTo(map).bindPopup(`🚗 Rule: ${nearest.rule}`);
          map.setView([nearest.lat,nearest.lng],17);
        } else alert("❌ No parking data nearby.");
      } catch(e){ alert("⚠️ Error fetching data."); }
    }

    const toggleBtn=document.getElementById("themeToggle");
    toggleBtn.addEventListener("click",()=>{
      document.body.classList.toggle("dark");
    });
  </script>
</body>
</html>
