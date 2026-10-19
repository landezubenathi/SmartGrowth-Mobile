/* Cache only same-origin, versioned/static app resources. Never cache API responses. */
const CACHE='smartgrowth-static-v1';
const ROOT=new URL('./',self.location.href).pathname;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([ROOT])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('smartgrowth-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 if(request.mode==='navigate'){
   event.respondWith(fetch(request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(ROOT,clone));}return response;}).catch(async()=>await caches.match(ROOT)||Response.error()));
   return;
 }
 if(!/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2|ico|json)$/.test(url.pathname))return;
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(request,clone));}return response;})));
});
