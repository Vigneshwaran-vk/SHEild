const CACHE_NAME = "sheild-ai-v1";

const urlsToCache = [
  "/",
  "index.html",
  "dashboard.html",
  "emergency.html",
  "contacts.html",
  "vault.html",
  "settings.html",
  "safezones.html",
  "onboarding.html",
  "css/style.css",
  "js/script.js"
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
