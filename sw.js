const CACHE_NAME = 'share-target-cache';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.includes('home.html')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const image = formData.get('image');
          const text = formData.get('text') || formData.get('url');
          const title = formData.get('title');

          console.log('SW received:', { image: !!image, text, title });

          const cache = await caches.open('share-data');
          
          await cache.delete('shared-image');
          await cache.delete('shared-link');
          await cache.delete('shared-title');

          if (image) await cache.put('shared-image', new Response(image));
          if (text) await cache.put('shared-link', new Response(text));
          if (title) await cache.put('shared-title', new Response(title));

          return Response.redirect('home_screen/home.html?action=shared', 303);
        } catch (error) {
          console.error('SW error:', error);
          return Response.redirect('home_screen/home.html', 303);
        }
      })()
    );
  }
});
