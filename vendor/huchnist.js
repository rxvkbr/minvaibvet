/* Загальна гучність Вайбвет FM.
   One volume for every sound the app makes: Web Audio (radio, Маестро, Диригент, Рація, Стіл, Офіс…),
   <audio>/<video> elements and the speech voice. The level lives in localStorage "vv-volume" (0–100),
   so every page, tab and frame of the same origin follows the same knob at once.
   Load it first, before any page script creates an AudioContext.

   API: VV_VOLUME.get() → 0–100 · set(v) · mute() · on(fn) · knob(container, {size}) → element.
   A page that has no knob of its own gets a small floating one the first time it makes a sound
   (top window only). Opt out: <html data-vv-no-knob>. */
(function(){
  "use strict";
  if(window.VV_VOLUME)return;
  var KEY="vv-volume",KEY0="vv-volume-before-mute";
  var TOP=true;try{TOP=window.top===window;}catch(e){TOP=false;}
  function read(k,d){try{var v=localStorage.getItem(k);if(v===null||v==="")return d;v=+v;return isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):d;}catch(e){return d;}}
  var level=read(KEY,100),fns=[],gains=[],medias=[];
  function g(){var x=level/100;return x*x;}          /* perceptual curve */

  /* ---- Web Audio: every context gets a master gain in front of the real speakers ---- */
  ["AudioContext","webkitAudioContext"].forEach(function(n){
    var C=window[n];if(!C||C.__vvVol)return;
    var W=function(a){
      var c=a===undefined?new C():new C(a);
      try{
        var real=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Object.getPrototypeOf(c)),"destination")||Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c),"destination");
        var out=real&&real.get?real.get.call(c):c.destination;
        var m=c.createGain();m.gain.value=g();m.connect(out);
        Object.defineProperty(c,"destination",{configurable:true,get:function(){return m;}});
        c.__vvOut=out;gains.push({c:c,m:m});
      }catch(e){}
      seen();return c;
    };
    W.prototype=C.prototype;W.__vvVol=1;try{window[n]=W;}catch(e){}
  });

  /* ---- <audio>/<video>: remember the page's own volume, multiply by ours ---- */
  function media(el){
    if(!el||el.__vvVol)return;el.__vvVol=1;el.__vvBase=el.volume;medias.push(el);
    var d=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,"volume");
    try{Object.defineProperty(el,"volume",{configurable:true,get:function(){return el.__vvBase;},
      set:function(v){el.__vvBase=v;d.set.call(el,Math.max(0,Math.min(1,v*g())));}});}catch(e){}
    try{d.set.call(el,Math.max(0,Math.min(1,el.__vvBase*g())));}catch(e){}
  }
  document.addEventListener("play",function(e){if(e.target instanceof HTMLMediaElement){media(e.target);seen();}},true);
  if(window.Audio){var A=window.Audio;var AW=function(s){var a=s===undefined?new A():new A(s);media(a);return a;};AW.prototype=A.prototype;try{window.Audio=AW;}catch(e){}}

  /* ---- the speech voice (Я загубився and friends) ---- */
  if(window.speechSynthesis&&speechSynthesis.speak){
    var sp=speechSynthesis.speak.bind(speechSynthesis);
    try{speechSynthesis.speak=function(u){try{u.volume=Math.max(0,Math.min(1,(u.volume==null?1:u.volume)*g()));}catch(e){}seen();return sp(u);};}catch(e){}
  }

  function apply(){
    gains.forEach(function(x){try{x.m.gain.setTargetAtTime(g(),x.c.currentTime,.03);}catch(e){try{x.m.gain.value=g();}catch(_){}}});
    var d=window.HTMLMediaElement&&Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,"volume");
    medias.forEach(function(el){try{d.set.call(el,Math.max(0,Math.min(1,el.__vvBase*g())));}catch(e){}});
    fns.forEach(function(f){try{f(level);}catch(e){}});
  }
  function set(v,quiet){
    v=Math.max(0,Math.min(100,Math.round(+v||0)));if(v===level&&!quiet)return;level=v;
    try{localStorage.setItem(KEY,String(v));if(v>0)localStorage.setItem(KEY0,String(v));}catch(e){}
    apply();
  }
  function mute(){if(level>0){try{localStorage.setItem(KEY0,String(level));}catch(e){}set(0);}else set(read(KEY0,70)||70);}
  window.addEventListener("storage",function(e){if(e.key===KEY){level=read(KEY,100);apply();}});

  /* ---- the knob ---- */
  var CSS=".vvk{--s:44px;--a:var(--vv-knob-accent,#f2b544);position:relative;width:var(--s);height:var(--s);border-radius:50%;border:0;padding:0;margin:0;"+
    "background:radial-gradient(circle at 35% 30%,#4a4a52,#1d1d22 70%);box-shadow:0 2px 6px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.12);"+
    "cursor:ns-resize;touch-action:none;color:#fff;font:600 10px/1 system-ui,sans-serif;flex:none;-webkit-tap-highlight-color:transparent}"+
    ".vvk svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}"+
    ".vvk .ic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--s)*.34);pointer-events:none}"+
    ".vvk:focus-visible{outline:2px solid var(--a);outline-offset:2px}"+
    ".vvk .tip{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);background:#111;color:#fff;padding:4px 7px;border-radius:6px;white-space:nowrap;"+
    "font:600 11px/1.2 system-ui,sans-serif;opacity:0;transition:opacity .15s;pointer-events:none}"+
    ".vvk.show .tip,.vvk:hover .tip{opacity:1}"+
    ".vvk-float{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:calc(10px + env(safe-area-inset-bottom));z-index:2147483000;opacity:.55;transition:opacity .2s}"+
    ".vvk-float:hover,.vvk-float:focus-visible,.vvk-float.show{opacity:1}"+
    ".vvk-float .tip{left:0;transform:none}"+
    "@media print{.vvk{display:none}}";
  function css(){if(document.getElementById("vvk-css"))return;var s=document.createElement("style");s.id="vvk-css";s.textContent=CSS;(document.head||document.documentElement).appendChild(s);}
  var A0=135,SPAN=270;
  function pt(r,deg){var a=(deg-90)*Math.PI/180;return (50+r*Math.cos(a)).toFixed(2)+" "+(50+r*Math.sin(a)).toFixed(2);}
  function arc(r,from,to){if(to-from<.5)return "";return "M"+pt(r,from)+" A"+r+" "+r+" 0 "+(to-from>180?1:0)+" 1 "+pt(r,to);}
  function knob(box,o){
    css();o=o||{};
    var b=document.createElement("button");b.type="button";b.className="vvk";b.setAttribute("role","slider");
    b.setAttribute("aria-label","Гучність усіх звуків");b.setAttribute("aria-valuemin","0");b.setAttribute("aria-valuemax","100");
    if(o.size)b.style.setProperty("--s",o.size+"px");
    b.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true"><path class="tr" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="8" stroke-linecap="round"/>'+
      '<path class="vl" fill="none" stroke="var(--a)" stroke-width="8" stroke-linecap="round"/><line class="pn" x1="50" y1="50" x2="50" y2="22" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>'+
      '<span class="ic"></span><span class="tip"></span>';
    b.querySelector(".tr").setAttribute("d",arc(42,A0-180+0,A0-180+SPAN));
    function paint(){
      var deg=A0-180+SPAN*level/100;
      b.querySelector(".vl").setAttribute("d",arc(42,A0-180,deg));
      var p=b.querySelector(".pn"),e=pt(26,deg).split(" ");p.setAttribute("x2",e[0]);p.setAttribute("y2",e[1]);
      b.querySelector(".ic").textContent=level===0?"🔇":"";
      b.querySelector(".tip").textContent=level===0?"Тиша · клік — повернути":"Гучність "+level+"% · клік — тиша";
      b.setAttribute("aria-valuenow",String(level));b.setAttribute("aria-valuetext",level===0?"без звуку":level+" відсотків");
      b.title="";
    }
    paint();fns.push(paint);
    var st=null,hideT=0;
    function flash(){b.classList.add("show");clearTimeout(hideT);hideT=setTimeout(function(){b.classList.remove("show");},1200);}
    b.addEventListener("pointerdown",function(e){st={x:e.clientX,y:e.clientY,v:level,moved:false};try{b.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();b.focus({preventScroll:true});});
    b.addEventListener("pointermove",function(e){if(!st)return;var d=(e.clientX-st.x)-(e.clientY-st.y);if(Math.abs(d)>3)st.moved=true;if(st.moved){set(st.v+d*.6);flash();}});
    function up(e){if(!st)return;var m=st.moved;st=null;if(!m&&e.type==="pointerup"){mute();flash();}}
    b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);
    b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();});
    b.addEventListener("wheel",function(e){e.preventDefault();set(level+(e.deltaY<0||e.deltaX>0?5:-5));flash();},{passive:false});
    b.addEventListener("keydown",function(e){
      var k=e.key,v=null;
      if(k==="ArrowUp"||k==="ArrowRight")v=level+5;else if(k==="ArrowDown"||k==="ArrowLeft")v=level-5;
      else if(k==="PageUp")v=level+20;else if(k==="PageDown")v=level-20;else if(k==="Home")v=0;else if(k==="End")v=100;
      else if(k==="Enter"||k===" "||k==="m"||k==="M"||k==="ь"||k==="Ь"){e.preventDefault();e.stopPropagation();mute();flash();return;}
      if(v!==null){e.preventDefault();e.stopPropagation();set(v);flash();}
    });
    b.setAttribute("data-vv-knob","");
    if(box)box.appendChild(b);
    return b;
  }

  /* a page that makes sound and has no knob of its own gets a floating one */
  var floated=false;
  function seen(){
    if(floated||!TOP)return;floated=true;
    var go=function(){
      if(document.documentElement.hasAttribute("data-vv-no-knob")||document.querySelector("[data-vv-knob]"))return;
      if(!document.body)return setTimeout(go,50);
      var k=knob(document.body,{size:40});k.classList.add("vvk-float");
    };
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(go,0);});else setTimeout(go,0);
  }

  window.VV_VOLUME={get:function(){return level;},set:function(v){set(v);},mute:mute,on:function(f){fns.push(f);},knob:knob,gain:g};
})();
