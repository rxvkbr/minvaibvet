/* Тактильний відгук для всього Вайбвет FM.
   Every tap on something tappable is felt: buttons and tabs, links, tiles, switches, sliders, game canvases.
   Pages and games add their own moments with VV_TAPTIC(kind):
     "tick" selection · "light" · "click" · "soft" · "rigid" · "heavy" · "success" · "warning" · "error" · "hammer" · "message"
   The rule of the house, so a pocket can be read without looking:
     three taps — only a new message in a Рація chat ("message", nothing else may use it);
     two taps at most — everything else that matters (success, warning, error, hammer);
     one tap — anything unimportant (buttons, coins, beans).
   In the apps it goes to the native Purr plugin (Taptic Engine on iPhone, the vibrator on Android);
   in a browser it falls back to navigator.vibrate where there is one. Off with localStorage "haptics" = "0". */
(function(){
  "use strict";
  if(window.VV_TAPTIC)return;
  var WEB={tick:6,light:6,soft:6,click:10,rigid:12,heavy:22,success:[14,60,24],warning:[22,80,22],error:[30,70,40],hammer:[24,120,44],message:[16,110,16,110,16]};
  var last=0,lastKind="";
  function on(){try{return localStorage.getItem("haptics")!=="0";}catch(e){return true;}}
  function purr(){try{var C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return null;
    if(C.Plugins&&C.Plugins.Purr)return C.Plugins.Purr;if(C.registerPlugin)return C.registerPlugin("Purr");}catch(e){}return null;}
  var TWO={success:1,warning:1,error:1,hammer:1};
  function feel(kind){
    kind=kind||"tick";if(!on())return;
    if(kind==="message"&&!/racia\.html$/.test(location.pathname))kind="success";   /* three taps belong to Рація alone */
    var now=Date.now();if(now-last<35&&(kind===lastKind||kind==="tick"))return;   /* never a buzzing mess */
    last=now;lastKind=kind;
    var P=purr();
    if(P&&P.tick){P.tick({kind:kind}).catch(function(){});return;}
    try{if(navigator.vibrate)navigator.vibrate(WEB[kind]||6);}catch(e){}
  }
  window.VV_TAPTIC=feel;
  window.VV_TAPTIC.on=on;
  window.VV_TAPTIC.set=function(v){try{localStorage.setItem("haptics",v?"1":"0");}catch(e){}if(v)feel("success");};

  /* the global layer: what kind of touch each kind of control gets */
  var SEL="button,a[href],[role=button],[role=tab],summary,label,.tile,.preset,select,input[type=checkbox],input[type=radio],input[type=range],canvas,.pt,.ab";
  document.addEventListener("pointerdown",function(e){
    var el=e.target&&e.target.closest&&e.target.closest(SEL);if(!el||el.closest("[data-taptic-off]"))return;
    if(el.classList.contains("vibe"))return;                                  /* «+ вайб» already answers on its own */
    var k="tick";
    if(el.tagName==="CANVAS")k="light";
    else if(el.matches("input[type=checkbox],input[type=radio],[aria-pressed]"))k="rigid";
    else if(el.matches(".preset,[role=tab],.tab,nav a,nav button"))k="tick";
    else if(el.matches("button,.tile,[role=button]"))k="soft";
    feel(k);
  },{capture:true,passive:true});
  /* a switch that changes state: a firmer click */
  document.addEventListener("change",function(e){var t=e.target;if(t&&t.matches&&t.matches("input[type=checkbox],input[type=radio]"))feel(t.checked?"click":"soft");},true);
  /* sliders tick as they move, like a dial with notches */
  var lastVal=new WeakMap();
  document.addEventListener("input",function(e){var t=e.target;if(!t||t.type!=="range")return;
    var step=(+t.max-+t.min)/20||1,v=Math.round(+t.value/step);if(lastVal.get(t)!==v){lastVal.set(t,v);feel("tick");}},true);
  /* other scripts can just dispatch an event: document.dispatchEvent(new CustomEvent("vv-haptic",{detail:"success"})) */
  document.addEventListener("vv-haptic",function(e){feel(e.detail);});
})();
