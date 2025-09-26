<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>uSpotly Features - Street Parking Finder NYC</title>
  <meta name="description" content="Discover all the benefits of uSpotly, a free and easy-to-use NYC street parking finder. Fast, mobile-friendly, and interactive.">
  <meta name="keywords" content="NYC parking, street parking NYC, parking rules NYC, free parking app, uSpotly">
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
  <style>
    body {margin:0; font-family:"Segoe UI",sans-serif; background:#f8fafc; color:#111; line-height:1.6; padding:20px;}
    h1,h2 {color:#2563eb;}
    a {color:#2563eb; text-decoration:none;}
    a:hover {text-decoration:underline;}
    nav {margin-bottom:20px;}
    nav a {margin-right:15px; font-weight:600;}
    ul {margin-left:20px;}
    #miniMap {width:100%; height:300px; margin:20px 0; border:1px solid #ccc;}
  </style>
</head>
<body>
  <nav>
    <a href="index.html">Home</a>
    <a href="privacy.html">Privacy</a>
    <a href="features.html">Features</a>
  </nav>

  <h1>uSpotly - Features & Benefits</h1>
  <p><strong>uSpotly is completely free for life.</strong> It’s designed to help all NYC residents and visitors find street parking easily, legally, and quickly. Here’s why users love it:</p>

  <h2>1. Real-Time Location Awareness</h2>
  <p>uSpotly uses your device's GPS to detect your exact location, showing nearby parking without manual input.</p>

  <h2>2. Nearest Parking Finder</h2>
  <p>Find the closest parking spot instantly. uSpotly displays:</p>
  <ul>
    <li>Allowed or restricted parking times</li>
    <li>Maximum allowed hours</li>
    <li>Special exceptions</li>
    <li>Color-coded markers: green for allowed, red for restricted</li>
  </ul>

  <h2>3. Smart Parking Rule Interpretation</h2>
  <p>uSpotly reads official NYC parking sign descriptions and interprets them, showing clear status and reasons to help you avoid fines.</p>

  <h2>4. Mobile-Friendly & Lightweight</h2>
  <p>The microsite is fast-loading and consumes minimal data, perfect for mobile users.</p>

  <h2>5. Dark Mode</h2>
  <p>Switch between light and dark modes to reduce eye strain while navigating at night.</p>

  <h2>6. Banner Monetization</h2>
  <p>Non-intrusive footer banner ads keep the map area clear while supporting uSpotly financially.</p>

  <h2>7. Progressive Web App (PWA) Ready</h2>
  <p>Install uSpotly on your home screen and access core features offline with service worker support.</p>

  <h2>8. Privacy-Friendly</h2>
  <p>No personal info is required. Location data is processed locally in your device and never shared.</p>

  <h2>9. Interactive Mini Map</h2>
  <p>Test uSpotly on this small map below. Click “Locate Me” to find your current position and nearby parking spots.</p>
  <div id="miniMap"></div>
  <button onclick="locateMiniUser()" style="padding:6px 12px; border-radius:6px; border:none; background:#2563eb; color:#fff; cursor:pointer;">Locate Me</button>

  <h2>10. Simple, Modern Interface</h2>
  <p>Clear buttons, responsive layout, and uncluttered maps make parking stress-free.</p>

  <p>With uSpotly, finding legal NYC street parking is easier, faster, and safer—all for free for life!</p>

  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    // Mini interactive map
    const miniMap = L.map('miniMap').setView([40.7128,-74.0060], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'© OpenStreetMap'}).addTo(miniMap);
    let miniMarker;

    function locateMiniUser(){
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(pos=>{
          const {latitude,longitude}=pos.coords;
          if(miniMarker) miniMap.removeLayer(miniMarker);
          miniMarker = L.marker([latitude,longitude]).addTo(miniMap).bindPopup("📍 You are here").openPopup();
          miniMap.setView([latitude,longitude],15);
        }, err=>{ alert("❌ Failed: "+err.message); });
      } else alert("❌ Geolocation not supported.");
    }
  </script>
</body>
</html>
