/* Remplace le canal temps réel Supabase par un BroadcastChannel (tests locaux). La partie RPC reste réelle. */
(function(){
  var real;
  function wrap(v){
    if(!v||v.__w||!v.createClient)return;
    var orig=v.createClient;v.__w=true;
    v.createClient=function(url,key,opts){
      var c=orig(url,key,opts);
      c.channel=function(name){return mock(name);};
      c.removeChannel=function(ch){if(ch&&ch._close)ch._close();};
      return c;
    };
  }
  function mock(name){
    var bc=new BroadcastChannel("mock-"+name),hs=[],closed=false;
    var ch={on:function(t,f,cb){hs.push({ev:f.event,cb:cb});return ch;},
      subscribe:function(cb){setTimeout(function(){cb("SUBSCRIBED");},30);return ch;},
      send:function(m){if(!closed)bc.postMessage({event:m.event,payload:JSON.parse(JSON.stringify(m.payload))});window.__sent=(window.__sent||0)+1;return Promise.resolve("ok");},
      _close:function(){closed=true;bc.close();}};
    bc.onmessage=function(e){hs.forEach(function(h){if(h.ev===e.data.event)h.cb({payload:e.data.payload});});};
    return ch;
  }
  Object.defineProperty(window,"supabase",{configurable:true,get:function(){wrap(real);return real;},set:function(v){real=v;}});
})();
