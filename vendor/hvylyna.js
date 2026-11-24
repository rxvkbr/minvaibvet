/* Загальнонаціональна хвилина мовчання.
   Every day at 09:00 Kyiv time (and on the fourth Saturday of November at 16:00, «Запали свічку»)
   every page of Вайбвет FM goes quiet: all functions disappear, every sound stops, a candle is lit.
   After the minute something quiet stays on screen until the listener chooses to return.
   Inside an embedded frame it only mutes; the top page draws the candle.
   Preview: add ?hvylyna to any page URL (a 12-second version). */
(function(){
  "use strict";
  if(window.__vvHvylyna)return;window.__vvHvylyna=1;
  var TOP=true;try{TOP=window.top===window;}catch(e){TOP=false;}

  /* keep track of every AudioContext so we can silence sounds made with Web Audio */
  var ctxs=[],RealAC=window.AudioContext||window.webkitAudioContext;
  ["AudioContext","webkitAudioContext"].forEach(function(n){
    var C=window[n];if(!C||C.__vvWrapped)return;
    var W=function(a){var c=a===undefined?new C():new C(a);ctxs.push(c);if(silent)try{c.suspend();}catch(e){}return c;};
    W.prototype=C.prototype;W.__vvWrapped=1;try{window[n]=W;}catch(e){}
  });

  function kyiv(){
    var d=new Date(),o={};
    try{new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kyiv",hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",weekday:"short"})
      .formatToParts(d).forEach(function(p){o[p.type]=p.value;});}
    catch(e){try{new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Kiev",hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",weekday:"short"}).formatToParts(d).forEach(function(p){o[p.type]=p.value;});}catch(x){return null;}}
    return {y:+o.year,mo:+o.month,d:+o.day,h:+o.hour%24,mi:+o.minute,s:+o.second,wd:o.weekday};
  }
  /* which minute is it, if any */
  function which(k){
    if(!k)return null;
    if(k.h===9&&k.mi===0)return {kind:"day",key:k.y+"-"+k.mo+"-"+k.d+"-9",left:60-k.s};
    if(k.mo===11&&k.wd==="Sat"&&k.d>=22&&k.d<=28&&k.h===16&&k.mi===0)return {kind:"svichka",key:k.y+"-svichka",left:60-k.s};
    return null;
  }

  var TEXTS=[
    ["Хвилина минула. Вони — ні.","Вони лишаються в тих, хто пам'ятає їхні голоси, звички й недоговорені розмови. Смерть забирає людину, але не забирає того, що людина встигла в нас залишити."],
    ["Тиша — це не порожнеча.","Це місце, де стоять ті, кого вже не обійняти. Її не треба нічим заповнювати. Досить постояти поруч."],
    ["Згадай когось одного.","Не за тим, як він загинув, а за тим, як сміявся. Пам'ять — це не тільки біль. Це ще й ім'я, яке ми не даємо забрати."],
    ["Горе не треба лагодити.","Його треба нести, і краще не самому. Якщо сьогодні важко — напиши комусь живому. Просто «ти як?». Цього досить."],
    ["Смерть — найтихіше, що є на війні.","Тому щодня о дев'ятій замовкає все інше: радіо, новини, ми. Хоча б на хвилину, щоб її почути."],
    ["Ми не знаємо всіх імен.","Але кожне з них комусь було найважливішим словом. Ця хвилина — за всі імена одразу."]
  ];
  var SVICHKA=["Четверта субота листопада.","Пам'ять жертв Голодоморів. Свічка у вікні — для тих, кому не дали хліба. Хліб на столі — для тих, хто вижив, щоб були ми."];

  var silent=false,shownKey=null,ov=null,paused=[],preview=/[?&]hvylyna\b/.test(location.search);
  try{shownKey=sessionStorage.getItem("vv-hvylyna");}catch(e){}

  function mute(on){
    silent=on;window.VV_SILENCE=on;
    if(on){
      paused=[];[].forEach.call(document.querySelectorAll("audio,video"),function(m){if(!m.paused){paused.push(m);try{m.pause();}catch(e){}}});
      ctxs.forEach(function(c){try{if(c.state==="running")c.suspend();}catch(e){}});
    }else{
      ctxs.forEach(function(c){try{c.resume();}catch(e){}});
      paused.forEach(function(m){try{var p=m.play();if(p&&p.catch)p.catch(function(){});}catch(e){}});paused=[];
    }
    try{document.documentElement.classList.toggle("vv-silence",on);}catch(e){}
  }

  /* one soft, low bell after the minute, if the browser allows sound */
  function bell(){
    try{if(!RealAC)return;var ac=new RealAC(); /* the original constructor: our own bell is not silenced */
      if(ac.state!=="running")ac.resume();
      var t=ac.currentTime+.05;[110,165,220.5].forEach(function(f,i){var o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=f;
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05/(i+1),t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+6);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+6.2);});
      setTimeout(function(){try{ac.close();}catch(e){}},7000);}catch(e){}
  }

  var CSS=".vvh{position:fixed;inset:0;z-index:2147483647;background:#050403;color:#efe6d0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;"+
    "font:16px/1.6 Georgia,'Times New Roman',serif;opacity:0;transition:opacity 1.6s ease;cursor:default;-webkit-user-select:none;user-select:none;touch-action:none}"+
    ".vvh.on{opacity:1}"+
    ".vvh .cnd{position:relative;width:34px;height:150px;margin-bottom:34px}"+
    ".vvh .wax{position:absolute;left:0;right:0;bottom:0;height:104px;border-radius:5px 5px 3px 3px;background:linear-gradient(90deg,#d9cdb2,#f6efe0 45%,#cbbd9e)}"+
    ".vvh .wick{position:absolute;left:16px;bottom:104px;width:2px;height:9px;background:#2a2118}"+
    ".vvh .fl{position:absolute;left:50%;bottom:110px;width:16px;height:34px;margin-left:-8px;border-radius:50% 50% 45% 45%/62% 62% 38% 38%;"+
    "background:radial-gradient(ellipse at 50% 78%,#fff8e0 0 18%,#ffd36b 32%,#ff9b2f 62%,#ff6a1a00 76%);transform-origin:50% 90%;animation:vvhf 2.6s ease-in-out infinite;filter:blur(.3px)}"+
    ".vvh .glow{position:absolute;left:50%;bottom:96px;width:220px;height:220px;margin-left:-110px;border-radius:50%;background:radial-gradient(#ffb44a2e,#ffb44a00 65%);animation:vvhg 3.4s ease-in-out infinite}"+
    "@keyframes vvhf{0%,100%{transform:scale(1,1) rotate(-1deg)}30%{transform:scale(.94,1.06) rotate(1.5deg)}60%{transform:scale(1.04,.96) rotate(-.5deg)}}"+
    "@keyframes vvhg{50%{opacity:.7;transform:scale(.94)}}"+
    ".vvh .k{font:12px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:#a89a7c}"+
    ".vvh .t1{margin-top:10px;font-size:19px;color:#efe6d0;max-width:30em}"+
    ".vvh .line{position:absolute;left:0;bottom:0;height:2px;background:#ffb44a55;width:0}"+
    ".vvh .after{max-width:30em;opacity:0;transform:translateY(8px);transition:opacity 2.4s ease,transform 2.4s ease}"+
    ".vvh .after.on{opacity:1;transform:none}"+
    ".vvh .after b{display:block;font-weight:400;font-size:24px;margin-bottom:10px;color:#fff6e2}"+
    ".vvh .after p{margin:0;color:#cfc4ab;font-size:17px}"+
    ".vvh .back{margin-top:34px;background:none;border:1px solid #6b5d44;color:#cfc4ab;border-radius:999px;padding:10px 22px;font:13px ui-monospace,Menlo,monospace;letter-spacing:.08em;cursor:pointer;opacity:0;transition:opacity 1.6s;pointer-events:none}"+
    ".vvh .back.on{opacity:1;pointer-events:auto}"+
    ".vvh .pv{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));left:0;right:0;font:11px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#6b5d44;text-transform:uppercase}"+
    "@media (prefers-reduced-motion:reduce){.vvh .fl,.vvh .glow{animation:none}}"+
    "html.vv-silence body{overflow:hidden!important}";

  function block(e){if(!ov)return;if(e.target&&e.target.closest&&e.target.closest(".vvh .back"))return;e.stopPropagation();if(e.cancelable&&e.type!=="pointermove")e.preventDefault();}
  var EV=["keydown","keyup","keypress","wheel","touchmove","contextmenu"];

  function show(w){
    if(ov)return;mute(true);
    if(!TOP){ /* embedded page: silence only, and come back when the top page lets go */
      setTimeout(function(){mute(false);},Math.max(1,w.left)*1000+400);return;}
    if(!document.getElementById("vvh-css")){var st=document.createElement("style");st.id="vvh-css";st.textContent=CSS;(document.head||document.documentElement).appendChild(st);}
    ov=document.createElement("div");ov.className="vvh";ov.setAttribute("role","dialog");ov.setAttribute("aria-modal","true");ov.setAttribute("aria-label","Хвилина мовчання");
    var sv=w.kind==="svichka",T=sv?SVICHKA:TEXTS[Math.floor(Date.now()/864e5)%TEXTS.length];
    ov.innerHTML=(w.preview?'<div class="pv">попередній перегляд</div>':'')+
      '<div class="cnd"><div class="glow"></div><div class="fl"></div><div class="wick"></div><div class="wax"></div></div>'+
      '<div class="now"><div class="k">'+(sv?"16:00 · Запали свічку":"09:00 · Загальнонаціональна хвилина мовчання")+'</div>'+
      '<div class="t1">'+(sv?"Пам'ять жертв Голодоморів.":"За всіма, чиє життя забрала війна.")+'</div></div>'+
      '<div class="after"><b></b><p></p></div><button type="button" class="back">повернутися</button><div class="line"></div>';
    ov.querySelector(".after b").textContent=T[0];ov.querySelector(".after p").textContent=T[1];
    (document.body||document.documentElement).appendChild(ov);
    EV.forEach(function(n){window.addEventListener(n,block,true);});
    try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(e){}
    requestAnimationFrame(function(){ov.classList.add("on");var ln=ov.querySelector(".line");ln.style.transition="width "+w.left+"s linear";requestAnimationFrame(function(){ln.style.width="100%";});});
    setTimeout(function(){ /* the minute is over: what stays is quiet */
      if(!ov)return;var now=ov.querySelector(".now");now.style.transition="opacity 2s";now.style.opacity="0";
      setTimeout(function(){if(!ov)return;now.style.display="none";ov.querySelector(".after").classList.add("on");bell();},2000);
      setTimeout(function(){if(ov)ov.querySelector(".back").classList.add("on");},9000);
    },w.left*1000);
    ov.querySelector(".back").addEventListener("click",function(){
      ov.classList.remove("on");EV.forEach(function(n){window.removeEventListener(n,block,true);});
      setTimeout(function(){if(ov){ov.remove();ov=null;}mute(false);},1600);
    });
  }

  function check(){
    if(ov)return;var w=which(kyiv());
    if(w&&w.key!==shownKey){shownKey=w.key;try{sessionStorage.setItem("vv-hvylyna",w.key);}catch(e){}show(w);}
  }
  function start(){
    if(preview){preview=false;show({kind:/svichka/.test(location.search)?"svichka":"day",key:"preview",left:12,preview:true});}
    check();setInterval(check,1000);
    document.addEventListener("visibilitychange",function(){if(!document.hidden)check();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
  window.VV_HVYLYNA={preview:function(kind){show({kind:kind||"day",key:"preview",left:12,preview:true});}};
})();
