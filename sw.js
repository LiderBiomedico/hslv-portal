const CACHE_NAME = 'hospital-technicians-v1';
const urlsToCache = [
    '/mobile-app.html',
    '/manifest.json',
    // Add other static assets here
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});

// Push event
self.addEventListener('push', event => {
    console.log('Push message received:', event);
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'Nueva solicitud asignada',
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: [
            {
                action: 'view',
                title: 'Ver Solicitud',
                icon: '/icon-view.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icon-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Hospital Técnicos', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    console.log('Notification click received:', event);
    
    event.notification.close();
    
    if (event.action === 'view') {
        // Open app and navigate to requests
        event.waitUntil(
            clients.openWindow('/mobile-app.html#assigned')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open app
        event.waitUntil(
            clients.openWindow('/mobile-app.html')
        );
    }
    
    // Send message to app about new request
    event.waitUntil(
        clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'NEW_REQUEST',
                    data: event.notification.data
                });
            });
        })
    );
});
