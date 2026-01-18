self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.includes('home.html')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const image = formData.get('image');
        const link = formData.get('text') || formData.get('url');
        const title = formData.get('title');

        const cache = await caches.open('share-data');
        
        if (image) {
          await cache.put('shared-image', new Response(image));
        }
        if (link) {
          await cache.put('shared-link', new Response(link));
        }
        if (title) {
            await cache.put('shared-title', new Response(title));
        }

        return Response.redirect('./home_screen/home.html?action=shared', 303);
      })()
    );
  }
});
