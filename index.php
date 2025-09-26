<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>uSpotly – Street Parking Finder NYC</title>
  <link rel="stylesheet" href="style.css">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0ff"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
</head>
<body>
  <header>
    <h1 onclick="window.location.href='index.html'" style="cursor:pointer;">uSpotly</h1>
    <nav>
      <button class="btn" onclick="locateUser()">My Location</button>
      <button class="btn" onclick="showNearest()">Nearest Parking</button>
      <button class="btn" onclick="window.location.href='privacy.html'">Privacy</button>
      <button class="btn" onclick="window.location.href='features.html'">Features</button>
      <button class="btn" id="themeToggle">🌙 Dark</button>
    </nav>
  </header>

  <div id="map"></div>

  <footer>
    <div class="ad-container" id="adContainer">
      <div class="ad-banner">Ad 1 </div>
      <div class="ad-banner">Ad 2 </div>
      <div class="ad-banner">Ad 3 </div>
      <div class="ad-banner">Ad 4 </div>
      <div class="ad-banner">Ad 5 </div>
      <div class="ad-banner">Ad 6 </div>
      <button class="hide-all-ads" onclick="hideAllAds()">↓</button>
    </div>
    <button class="btn show-ad-btn" id="showAdBtn" onclick="showAllAds()">Show Ads</button>
    <div class="footer-text">&copy; 2025 Street Parking Finder NYC</div>
  </footer>

  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script src="app.js"></script>
</body>
</html>
