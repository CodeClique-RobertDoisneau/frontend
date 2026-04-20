// Pyodide Service Worker for Synchronous Stdin Interception

const inputResolvers = new Map();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/__get_stdin__') {
    const id = url.searchParams.get('id');
    
    if (!id) {
      event.respondWith(new Response('Missing execution ID', { status: 400 }));
      return;
    }

    // Intercept the sync XHR from the worker and hold it pending
    event.respondWith(
      new Promise((resolve) => {
        inputResolvers.set(id, resolve);
      })
    );
  }
});

self.addEventListener('message', (event) => {
  const data = event.data;

  if (data?.type === 'INPUT_RESPONSE') {
    const resolve = inputResolvers.get(data.id);
    if (resolve) {
      const response = new Response(data.value, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
      
      resolve(response);
      inputResolvers.delete(data.id);
    }
  }
});
