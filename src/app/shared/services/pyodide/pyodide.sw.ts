/// <reference lib="webworker" />

// This tells TS that 'self' is a Service Worker context
const sw = self as unknown as ServiceWorkerGlobalScope;

const inputResolvers = new Map<string, (value: Response | PromiseLike<Response>) => void>();

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(sw.clients.claim());
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/__get_stdin__') {
    const id = url.searchParams.get('id');
    
    if (!id) {
      event.respondWith(new Response('Missing execution ID', { status: 400 }));
      return;
    }

    // We intercept the sync XHR from the worker
    event.respondWith(
      new Promise<Response>((resolve) => {
        inputResolvers.set(id, resolve);
      })
    );
  }
});

interface PyodideSWInputResponse {
  type: 'INPUT_RESPONSE';
  id: string;
  value: string;
}

sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as PyodideSWInputResponse;

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
