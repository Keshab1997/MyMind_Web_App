self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname.includes('index.html')) {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const title = formData.get('title') || '';
                const text = formData.get('text') || '';
                const urlStr = formData.get('url') || '';
                const mediaFile = formData.get('media');

                const cache = await caches.open('share-data');
                
                await cache.put('shared-data', new Response(JSON.stringify({
                    title: title,
                    text: text,
                    url: urlStr,
                    hasFile: !!mediaFile
                })));

                if (mediaFile) {
                    await cache.put('shared-file', new Response(mediaFile));
                }

                return Response.redirect('./index.html?action=shared', 303);
            })()
        );
    }
});
