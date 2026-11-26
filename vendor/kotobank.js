/* Котобанк: котобакси на блокчейні, як заповідали.
   VV_KOTO.earn(amount, reason) — нараховує котобакси новим блоком у ланцюжку (SHA-256 від попереднього блока);
   VV_KOTO.spend(amount, reason) — списує (якщо вистачає); VV_KOTO.balance(); VV_KOTO.chain(); VV_KOTO.verify() → Promise<bool>.
   Котобакси не мають жодної цінності: їх не можна купити, продати чи вивести. Ланцюжок живе тільки на цьому пристрої. */
(function(){
  "use strict";
  if(window.VV_KOTO)return;
  var KEY="kotobank-chain";
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){return [];}}
  function save(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");}
  function sha(s){
    if(window.crypto&&crypto.subtle)return crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)).then(hex);
    var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return Promise.resolve(("00000000"+(h>>>0).toString(16)).slice(-8).repeat(8));
  }
  function body(b){return [b.i,b.t,b.a,b.r,b.p].join("|");}
  var queue=Promise.resolve();
  function add(a,r){
    queue=queue.then(function(){
      var c=load();
      if(!c.length){c.push({i:0,t:Date.now(),a:0,r:"Генезис-блок: кіт ліг на клавіатуру",p:"0".repeat(64)});return sha(body(c[0])).then(function(h){c[0].h=h;save(c);return c;});}
      return c;
    }).then(function(c){
      var b={i:c.length,t:Date.now(),a:a,r:r,p:c[c.length-1].h};
      return sha(body(b)).then(function(h){b.h=h;c.push(b);save(c);
        try{window.dispatchEvent(new CustomEvent("kotobank",{detail:b}));}catch(e){}return b;});
    });
    return queue;
  }
  function balance(){return load().reduce(function(s,b){return s+(b.a||0);},0);}
  function cue(a){
    try{if(window.VV_TAPTIC)VV_TAPTIC(a>=25?"success":"light");}catch(e){}
    try{var C=window.AudioContext||window.webkitAudioContext;if(!C)return;var x=cue.ctx||(cue.ctx=new C());if(x.state!=="running")x.resume();
      var t=x.currentTime;[1318.5,1760,2637].forEach(function(f,i){var o=x.createOscillator(),g=x.createGain();o.type="sine";o.frequency.value=f;
        g.gain.setValueAtTime(.0001,t+i*.06);g.gain.exponentialRampToValueAtTime(.08,t+i*.06+.005);g.gain.exponentialRampToValueAtTime(.0001,t+i*.06+.35);o.connect(g);g.connect(x.destination);o.start(t+i*.06);o.stop(t+i*.06+.4);});}catch(e){}
  }
  window.VV_KOTO={
    earn:function(a,r,quiet){a=Math.round(a);if(!(a>0))return Promise.resolve(null);if(!quiet)cue(a);return add(a,r||"");},
    spend:function(a,r){a=Math.round(a);if(!(a>0)||balance()<a)return Promise.resolve(null);return add(-a,r||"");},
    balance:balance,chain:load,
    verify:function(){var c=load(),p=Promise.resolve(true);
      c.forEach(function(b,i){p=p.then(function(ok){if(!ok)return false;if(i>0&&b.p!==c[i-1].h)return false;return sha(body(b)).then(function(h){return h===b.h;});});});return p;},
    daily:function(){var d=new Date().toISOString().slice(0,10);try{if(localStorage.getItem("kotobank-day")===d)return;localStorage.setItem("kotobank-day",d);}catch(e){return;}
      return this.earn(5,"Щоденний вайб: ти зайшов, кіт помітив",true);}
  };
})();
