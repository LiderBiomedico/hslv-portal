// Service Worker for HSLV Support App
const CACHE_NAME = 'hslv-support-v1';
const urlsToCache = [
  '/app-tecnico.html',
  '/airtable-config.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('api.airtable.com') || 
      event.request.url.includes('/.netlify/functions/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
        })
        .catch(() => {
          // Return offline page if available
          return caches.match('/app-tecnico.html');
        })
    );
  }
});

// Push notification event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva solicitud asignada',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Solicitud',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('📋 Nueva Solicitud', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app and focus
    event.waitUntil(
      clients.openWindow('/app-tecnico.html')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncRequests());
  }
});

// Sync function to upload pending data when back online
async function syncRequests() {
  try {
    // Get pending requests from IndexedDB or localStorage
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      for (const data of pendingData) {
        try {
          // Send to Airtable
          const response = await fetch('/.netlify/functions/sync-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (response.ok) {
            // Remove from pending if successful
            await removePendingData(data.id);
          }
        } catch (error) {
          console.error('Sync failed for item:', error);
        }
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingData() {
  // Implementation would use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingData(id) {
  // Implementation would remove from IndexedDB
  console.log('Removing synced data:', id);
}

// Check for app updates every hour
setInterval(() => {
  self.registration.update();
}, 3600000);