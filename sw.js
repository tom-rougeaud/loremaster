/* Service worker Lore Master : met en cache les pages et icônes (hors-ligne pour l’entraînement solo).
   Réseau d’abord (pour toujours avoir la dernière version), cache en secours. Supabase n’est jamais mis en cache. */
var V="lm-1.2";
var FILES=["./","index.html","mj.html","joueur.html","contact.html","confidentialite.html","config.js","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(FILES.map(function(f){return c.add(f).catch(function(){});}));}).then(function(){return self.skipWaiting();}));});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener("fetch",function(e){
  var r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp);});return res;}).catch(function(){return caches.match(r,{ignoreSearch:true});}));
});
