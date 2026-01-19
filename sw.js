const CACHE_NAME = 'my-mind-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './login.html',
    './login_script.js',
    './login_style.css',
    './style.css',
    './script.js',
    './supabase_config.js',
    './manifest.json',
    './home_screen/home.html',
    './home_screen/home.css',
    './home_screen/home.js',
    './detail_screen/detail.html',
    './detail_screen/detail.css',
    './detail_screen/detail.js',
    './features/dark_mode/dark_mode.css',
    './features/dark_mode/dark_mode.js',
    './features/sounds/sounds.js',
    './features/quick_note/index.html',
    './features/quick_note/style.css',
    './features/quick_note/script.js',
    './features/success_splash/index.html',
    './features/success_splash/style.css',
    './features/success_splash/script.js',
    './splash_screen/splash.html',
    './splash_screen/splash.css',
    './splash_screen/splash.js',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
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
                await cache.put('shared-data', new Response(JSON.stringify({ title, text, url: urlStr })));
                if (mediaFile) await cache.put('shared-file', new Response(mediaFile));

                return Response.redirect('./index.html?action=shared', 303);
            })()
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
