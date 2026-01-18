self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname.includes('/home.html')) {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    
                    const sharedLink = formData.get('url') || formData.get('text') || '';
                    const sharedTitle = formData.get('title') || '';

                    const cache = await caches.open('share-data');
                    
                    await cache.put('shared-data', new Response(JSON.stringify({
                        link: sharedLink,
                        title: sharedTitle
                    })));

                    return Response.redirect('/home_screen/home.html?action=shared', 303);
                } catch (error) {
                    console.error('SW error:', error);
                    return Response.redirect('/home_screen/home.html', 303);
                }
            })()
        );
    }
});
