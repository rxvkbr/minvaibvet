/* «Легіон» — the Warcraft-3-style interface sound pack of Вайбвет FM.
   Two units answer your taps: Андрійко-Некромант from the beyond and Девід, the good sailor.
   The first tap after a pause selects the next unit (it introduces itself), taps that follow get «will do» lines,
   and poking too often annoys it, a little more each time — like the old RTS units did.
   Voices are short mp3s in audio/legion/<lang>/ (made by tools/legion-voices.py) in all six languages of the site.
   Dopamine sounds (coins, a level-up fanfare) are synthesised and come with a soft haptic tick in the apps.
   On when localStorage "ui-pack" is "legion"; the «Звуки інтерфейсу» tile cycles дзеньк → Легіон → тиша.
   VV_LEGION.on() / set(bool) / reward("coin"|"level") / say(who, kind) */
(function(){
  "use strict";
  if(window.VV_LEGION)return;
  var LANGS=["uk","en","nl","ar","zh","ru"],N={select:3,ack:4,annoyed:4},WHO=["nekromant","moriak"];
  function on(){try{return localStorage.getItem("ui-pack")==="legion"&&localStorage.getItem("ui-sound")!=="0";}catch(e){return false;}}
  function lang(){var l="uk";try{l=localStorage.getItem("lang")||document.documentElement.lang||"uk";}catch(e){}return LANGS.indexOf(l)>=0?l:"uk";}

  var ac=null,out=null,cache={};
  function ctx(){
    if(!ac){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();out=ac.createGain();out.gain.value=0.9;out.connect(ac.destination);}
    if(ac.state==="suspended")ac.resume();return ac;
  }
  function load(url){
    if(cache[url])return cache[url];
    cache[url]=fetch(url).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer();}).then(function(b){
      return new Promise(function(ok,no){ctx().decodeAudioData(b,ok,no);});}).catch(function(){delete cache[url];return null;});
    return cache[url];
  }
  var playing=null,busyUntil=0;
  function voice(who,kind,i){
    if(!ctx())return;
    var url="audio/legion/"+lang()+"/"+who+"-"+kind+"-"+i+".mp3";
    load(url).then(function(buf){
      if(!buf)return;
      if(playing){try{playing.stop();}catch(e){}}
      var s=ac.createBufferSource();s.buffer=buf;s.connect(out);s.start();playing=s;busyUntil=performance.now()+buf.duration*1000;
      s.onended=function(){if(playing===s)playing=null;};
    });
  }
  /* warm the cache for the unit that will speak next, so the first line is instant */
  function warm(who){var l=lang();["select","ack"].forEach(function(k){for(var i=0;i<N[k];i++)load("audio/legion/"+l+"/"+who+"-"+k+"-"+i+".mp3");});}

  /* ---- synthesised: the RTS unit click, coins, a level-up ---- */
  function tone(t,f,len,vol,type,bend){
    var o=ac.createOscillator(),g=ac.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(bend)o.frequency.exponentialRampToValueAtTime(f*bend,t+len);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.006);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+len+0.02);
  }
  function click(who){if(!ctx())return;var t=ac.currentTime;
    if(who==="nekromant"){tone(t,220,0.12,0.08,"sawtooth",0.5);tone(t+0.01,660,0.08,0.03,"sine",0.7);}
    else{tone(t,520,0.07,0.06,"triangle",1.3);tone(t+0.05,780,0.09,0.05,"triangle");}}
  function coin(){if(!ctx())return;var t=ac.currentTime;tone(t,1318.5,0.09,0.12,"square");tone(t+0.07,1975.5,0.35,0.11,"square");
    for(var i=0;i<5;i++)tone(t+0.12+i*0.035,2600+Math.random()*1800,0.12,0.025,"sine");}
  function level(){if(!ctx())return;var t=ac.currentTime;
    [[523.25,0],[659.25,0.11],[783.99,0.22],[1046.5,0.33]].forEach(function(n){tone(t+n[1],n[0],0.32,0.09,"sawtooth");tone(t+n[1],n[0]*2,0.25,0.03,"sine");});
    tone(t+0.45,1046.5,0.9,0.08,"triangle");tone(t+0.45,1318.5,0.9,0.06,"triangle");tone(t+0.45,1567.98,0.9,0.05,"triangle");}
  function haptic(kind){
    if(window.VV_TAPTIC){VV_TAPTIC(kind==="level"?"success":kind==="click"?"soft":kind);return;}
    try{var C=window.Capacitor,P=C&&C.Plugins&&C.Plugins.Purr;if(P&&P.tick){P.tick({kind:kind||"click"}).catch(function(){});return;}}catch(e){}
    try{navigator.vibrate&&navigator.vibrate(kind==="level"?[12,40,18]:8);}catch(e){}
  }

  /* ---- the units ---- */
  var unit=0,lastTap=-1e9,taps=[],annoy=[0,0],lastIdx={};
  function pick(who,kind){var n=N[kind],k=who+kind,p=lastIdx[k],i=Math.floor(Math.random()*n);if(n>1&&i===p)i=(i+1)%n;lastIdx[k]=i;return i;}
  function tap(){
    var now=performance.now(),who;
    taps=taps.filter(function(x){return now-x<4500;});taps.push(now);
    if(now-lastTap>2600){unit=(unit+1)%2;who=WHO[unit];annoy[unit]=0;click(who);if(now>busyUntil-200)voice(who,"select",pick(who,"select"));warm(WHO[(unit+1)%2]);}
    else{
      who=WHO[unit];click(who);
      if(taps.length>=6){voice(who,"annoyed",annoy[unit]%N.annoyed);annoy[unit]++;taps=[];}
      else if(now>busyUntil&&Math.random()<0.7)voice(who,"ack",pick(who,"ack"));
    }
    lastTap=now;
  }

  document.addEventListener("click",function(e){
    if(!on())return;
    var el=e.target&&e.target.closest&&e.target.closest("button,a[href],[role=button],.tile,summary,label,input[type=checkbox],input[type=radio]");
    if(!el||el.closest("[data-legion-off]"))return;
    if(el.classList.contains("vibe")){coin();haptic("click");return;}   /* «+ вайб»: gold, no speech, it is tapped a lot */
    tap();haptic("click");
  },true);

  window.VV_LEGION={
    on:on,
    set:function(v){try{localStorage.setItem("ui-pack",v?"legion":"");}catch(e){}if(v){ctx();warm(WHO[(unit+1)%2]);}},
    reward:function(k){if(!on())return;if(k==="level")level();else coin();haptic(k==="level"?"level":"click");},
    say:function(who,kind){voice(who,kind,pick(who,kind));},
    level:level,coin:coin
  };
})();
