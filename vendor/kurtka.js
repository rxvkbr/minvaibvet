/* «Нейровайб: тактичний маневр по куртку» — two line soldiers (no likeness of anyone) step out into the cold,
   one goes back for his jacket, the other shrugs and follows. A demarcation line is drawn, the fiercest guard
   imaginable (a goose in a helmet) takes post, and everyone else goes to rest. Not up for discussion.
   VV_KURTKA(el) turns any element into the little stage with ▶ and 🔊. Drawn locally; the sound is synthesised
   with Web Audio, so the app-wide volume knob applies. */
(function(){
  "use strict";
  if(window.VV_KURTKA)return;
  var NS="http://www.w3.org/2000/svg",FLOOR=228,DUR=26;
  var CSS=".kurtka{position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(#1a2330,#2b3a48 60%,#1b232c);border:1px solid #ffffff1a;margin:1.2em 0;font-family:ui-monospace,Menlo,monospace}"+
    ".kurtka svg{display:block;width:100%;height:auto}"+
    ".kurtka .bar{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;background:#0006;font-size:12px;color:#cdd6de}"+
    ".kurtka button{font:inherit;color:#eef3f6;background:#ffffff14;border:1px solid #ffffff26;border-radius:999px;padding:6px 12px;cursor:pointer}"+
    ".kurtka .cover{position:absolute;inset:0 0 40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0b1016b8;color:#eef3f6;cursor:pointer;text-align:center;padding:0 16px}"+
    ".kurtka .cover b{font:700 20px Georgia,serif}.kurtka .cover span{font-size:12px;color:#cdd6de}"+
    ".kurtka .cover i{font-style:normal;font-size:30px;width:62px;height:62px;border-radius:50%;background:#e9a23b;color:#1a1208;display:flex;align-items:center;justify-content:center;padding-left:4px;box-sizing:border-box}"+
    ".kurtka .cover[hidden]{display:none}";
  function css(){if(document.getElementById("kurtka-css"))return;var s=document.createElement("style");s.id="kurtka-css";s.textContent=CSS;document.head.appendChild(s);}
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
  function lerp(a,b,k){return a+(b-a)*k;}
  function ease(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}
  function clamp(x){return Math.max(0,Math.min(1,x));}
  function v(a,l){var r=a*Math.PI/180;return [Math.sin(r)*l,Math.cos(r)*l];}   /* angle 0 = down, 90 = right */

  /* ---- a stick soldier: hip, torso, head with a helmet, arms, legs; a jacket makes the lines thick and olive ---- */
  var L={t:46,ua:25,fa:23,th:38,sh:38,head:10};
  function rig(g){
    var o={g:g};
    o.parts=["torso","la1","la2","ra1","ra2","ll1","ll2","rl1","rl2"].reduce(function(m,k){m[k]=el("line",{"stroke-linecap":"round"},g);return m;},{});
    o.head=el("circle",{r:L.head,fill:"#e9dcc8",stroke:"#e9dcc8","stroke-width":2},g);
    o.helmet=el("path",{fill:"#5b6b3e",stroke:"#3d4829","stroke-width":1.5},g);
    return o;
  }
  function dress(o,jacket){
    var tor=jacket?["#6b7a45",11]:["#e9dcc8",4],arm=jacket?["#6b7a45",8]:["#e9dcc8",3.6],leg=["#4a5236",5];
    ["torso"].forEach(function(n){o.parts[n].setAttribute("stroke",tor[0]);o.parts[n].setAttribute("stroke-width",tor[1]);});
    ["la1","la2","ra1","ra2"].forEach(function(n){o.parts[n].setAttribute("stroke",arm[0]);o.parts[n].setAttribute("stroke-width",arm[1]);});
    ["ll1","ll2","rl1","rl2"].forEach(function(n){o.parts[n].setAttribute("stroke",leg[0]);o.parts[n].setAttribute("stroke-width",leg[1]);});
  }
  function draw(o,p){
    var hx=p.x,hy=p.y,nk=[hx,hy-L.t];
    function seg(n,a,b){var e=o.parts[n];e.setAttribute("x1",a[0].toFixed(1));e.setAttribute("y1",a[1].toFixed(1));e.setAttribute("x2",b[0].toFixed(1));e.setAttribute("y2",b[1].toFixed(1));}
    seg("torso",[hx,hy],nk);
    var sh=[nk[0],nk[1]+5-(p.shrug||0)];
    function limb(n1,n2,o0,a1,a2,l1,l2){var d1=v(a1,l1),j=[o0[0]+d1[0],o0[1]+d1[1]],d2=v(a2,l2),e=[j[0]+d2[0],j[1]+d2[1]];seg(n1,o0,j);seg(n2,j,e);return e;}
    var lh=limb("la1","la2",sh,p.la1,p.la2,L.ua,L.fa),rh=limb("ra1","ra2",sh,p.ra1,p.ra2,L.ua,L.fa);
    limb("ll1","ll2",[hx,hy],p.ll1,p.ll2,L.th,L.sh);limb("rl1","rl2",[hx,hy],p.rl1,p.rl2,L.th,L.sh);
    var hd=[nk[0]+(p.look||0)*2,nk[1]-L.head-3+(p.shrug||0)*.4];
    o.head.setAttribute("cx",hd[0].toFixed(1));o.head.setAttribute("cy",hd[1].toFixed(1));
    var f=p.face||1,r=L.head+3;   /* helmet: a dome with a brim towards where he looks */
    o.helmet.setAttribute("d","M"+(hd[0]-r).toFixed(1)+" "+(hd[1]-1).toFixed(1)+" A"+r+" "+r+" 0 0 1 "+(hd[0]+r).toFixed(1)+" "+(hd[1]-1).toFixed(1)+" L"+(hd[0]+f*(r+5)).toFixed(1)+" "+(hd[1]+1).toFixed(1)+" L"+(hd[0]-f*r).toFixed(1)+" "+(hd[1]+1).toFixed(1)+" Z");
    return {lh:lh,rh:rh,head:hd};
  }
  var KEYS=["x","y","la1","la2","ra1","ra2","ll1","ll2","rl1","rl2","shrug","look","face"];
  function P(o){return Object.assign({x:0,y:FLOOR-76,la1:-12,la2:-6,ra1:12,ra2:6,ll1:-6,ll2:-4,rl1:6,rl2:4,shrug:0,look:0,face:1},o);}
  function mix(a,b,k){var o={};KEYS.forEach(function(n){o[n]=lerp(a[n],b[n],k);});o.face=k<.5?a.face:b.face;return o;}
  function track(K,t){var i=0;while(i<K.length-2&&t>K[i+1][0])i++;var a=K[i],b=K[i+1];return mix(a[1],b[1],ease(clamp((t-a[0])/(b[0]-a[0]||1))));}
  function walking(p,t,t1,t2){if(t<t1||t>t2)return p;var ph=(t-t1)*Math.PI*2*1.4,s=Math.sin(ph);
    p.ll1=24*s;p.ll2=p.ll1-Math.max(0,26*Math.sin(ph+.6));p.rl1=-24*s;p.rl2=p.rl1-Math.max(0,26*Math.sin(ph+Math.PI+.6));
    p.la1=-16*s;p.la2=p.la1-8;p.ra1=16*s;p.ra2=p.ra1+8;p.y=FLOOR-76-Math.abs(Math.cos(ph))*2;return p;}
  function shiver(p,t){var q=Math.sin(t*55)*1.4;p.x+=q;p.la1=-40;p.la2=70;p.ra1=40;p.ra2=-70;return p;}   /* arms hugging the chest */

  /* ---- A stays, B goes first ---- */
  var A0=P({x:150,face:1}),B0=P({x:330,face:-1});
  var KA=[[0,A0],[9,A0],[9.6,P({x:150,face:1,look:3})],
    [10.2,P({x:150,face:1,look:3,shrug:7,la1:-62,la2:-150,ra1:62,ra2:150})],[11,P({x:150,face:1,look:3,shrug:7,la1:-62,la2:-150,ra1:62,ra2:150})],
    [11.6,P({x:150,face:1})],[12.6,P({x:226,face:1})],[13.1,P({x:226,face:1,ra1:150,ra2:172})],[13.6,P({x:226,face:-1})],[15,P({x:-40,face:-1})],[DUR,P({x:-40,face:-1})]];
  var KB=[[0,B0],[4,B0],[5,P({x:256,face:-1})],[5.5,P({x:256,face:-1,la1:-150,la2:-172})],[6,P({x:256,face:1})],[8.6,P({x:520,face:1})],[DUR,P({x:520,face:1})]];
  function soldierA(t){var p=track(KA,t);if(t<4)shiver(p,t);if(t>=11.6&&t<12.6)walking(p,t,11.6,12.6);if(t>=13.6)walking(p,t,13.6,15);if(t>=4&&t<9.6&&!(t>=9))shiver(p,t);return p;}
  function soldierB(t){var p=track(KB,t);if(t<4)shiver(p,t+1.3);if(t>=4&&t<5)walking(p,t,4,5);if(t>=6)walking(p,t,6,8.6);return p;}

  var CAP=[[0,"Вийшли подихати. Без курток."],[2.2,"Відступити чи терпіти?"],[4.2,"Тактичний маневр."],[8.7,"…"],[9.9,"🤷"],[11.7,"Відступ заради тепла. Без ганьби."],
    [15.2,"Демаркаційну зону проведено."],[17,"Охорона: найжорстокіша з можливих."],[19.4,"Всі інші йдуть відпочивати."],[22,"Не обговорюється."]];
  function cap(t){var c="";for(var i=0;i<CAP.length;i++)if(t>=CAP[i][0])c=CAP[i][1];return c;}

  /* ---- sound: winter wind, a zip, footsteps, the goose ---- */
  function Sound(){
    var ac=null,master=null,wind=null;
    function ctx(){if(!ac){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();master=ac.createGain();master.gain.value=.6;master.connect(ac.destination);}if(ac.state==="suspended")ac.resume();return ac;}
    var nb=null;function noise(){if(nb)return nb;nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);var d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb;}
    this.windOn=function(){if(!ctx()||wind)return;var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();
      s.buffer=noise();s.loop=true;f.type="bandpass";f.frequency.value=500;f.Q.value=.8;l.frequency.value=.25;lg.gain.value=300;l.connect(lg);lg.connect(f.frequency);
      g.gain.setValueAtTime(0,ac.currentTime);g.gain.linearRampToValueAtTime(.16,ac.currentTime+1);s.connect(f);f.connect(g);g.connect(master);s.start();l.start();wind={s:s,l:l,g:g};};
    this.windOff=function(){if(!wind)return;var w=wind;wind=null;var t=ac.currentTime;w.g.gain.setValueAtTime(w.g.gain.value,t);w.g.gain.linearRampToValueAtTime(0,t+.6);w.s.stop(t+.7);w.l.stop(t+.7);};
    this.zip=function(){window.VV_TAPTIC&&VV_TAPTIC("rigid");if(!ctx())return;var t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise();f.type="bandpass";f.Q.value=6;
      f.frequency.setValueAtTime(1800,t);f.frequency.exponentialRampToValueAtTime(5200,t+.35);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.4,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+.4);
      s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.45);};
    this.step=function(){if(!ctx())return;var t=ac.currentTime,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise();f.type="lowpass";f.frequency.value=900;
      g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.1);};
    this.honk=function(hiss){window.VV_TAPTIC&&VV_TAPTIC(hiss?"warning":"click");if(!ctx())return;var t=ac.currentTime;
      if(hiss){var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise();f.type="highpass";f.frequency.value=3000;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+.9);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+1);return;}
      [0,.22].forEach(function(d){var o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type="sawtooth";o.frequency.setValueAtTime(420,t+d);o.frequency.linearRampToValueAtTime(330,t+d+.16);
        f.type="bandpass";f.frequency.value=900;f.Q.value=2;g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.3,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.18);
        o.connect(f);f.connect(g);g.connect(master);o.start(t+d);o.stop(t+d+.2);});};
    this.stopAll=function(){this.windOff();};
  }

  window.VV_KURTKA=function(box){
    if(!box||box.__kurtka)return;box.__kurtka=1;css();
    box.classList.add("kurtka");box.setAttribute("data-noi18n","");
    var svg=el("svg",{viewBox:"0 0 480 270",role:"img","aria-label":"Анімація: два солдати мерзнуть без курток, один повертається по куртку й іде, другий знизує плечима й теж іде; демаркаційну лінію охороняє гуска в касці, всі інші йдуть відпочивати"},box);
    /* far shore: a house with a warm window, where the rest goes */
    el("rect",{x:0,y:FLOOR-44,width:480,height:2,fill:"#ffffff12"},svg);
    var house=el("g",{},svg);
    el("path",{d:"M372 184 v-18 l14 -10 l14 10 v18 z",fill:"#121820"},house);
    var win=el("rect",{x:380,y:170,width:9,height:8,fill:"#f2b45a",opacity:.85},house);
    var winGlow=el("circle",{cx:384.5,cy:174,r:16,fill:"#f2b45a",opacity:.12},house);
    el("text",{x:386,y:150,"text-anchor":"middle",fill:"#cdd6de","font-size":7,"letter-spacing":"1"},house).textContent="ВІДПОЧИНОК";
    /* the rest, small, walking home */
    var rest=el("g",{opacity:0},svg),restP=[];
    for(var i=0;i<3;i++){var gg=el("g",{},rest);el("circle",{cx:0,cy:-17,r:3,fill:"#5b6b3e"},gg);el("line",{x1:0,y1:-14,x2:0,y2:-5,stroke:"#6b7a45","stroke-width":4.5,"stroke-linecap":"round"},gg);
      var lg1=el("line",{x1:0,y1:-5,x2:-2,y2:2,stroke:"#4a5236","stroke-width":2,"stroke-linecap":"round"},gg),lg2=el("line",{x1:0,y1:-5,x2:2,y2:2,stroke:"#4a5236","stroke-width":2,"stroke-linecap":"round"},gg);restP.push([gg,lg1,lg2]);}
    /* ground */
    el("rect",{x:0,y:FLOOR,width:480,height:42,fill:"#dfe7ec22"},svg);
    el("line",{x1:0,y1:FLOOR,x2:480,y2:FLOOR,stroke:"#ffffff30"},svg);
    /* coat rack with two jackets */
    el("line",{x1:240,y1:FLOOR,x2:240,y2:FLOOR-96,stroke:"#7b5a3c","stroke-width":4},svg);
    el("line",{x1:228,y1:FLOOR,x2:252,y2:FLOOR,stroke:"#7b5a3c","stroke-width":4,"stroke-linecap":"round"},svg);
    el("line",{x1:226,y1:FLOOR-92,x2:254,y2:FLOOR-92,stroke:"#7b5a3c","stroke-width":3,"stroke-linecap":"round"},svg);
    function jacket(x){return el("path",{d:"M"+(x-9)+" "+(FLOOR-90)+" l18 0 l4 34 l-26 0 z M"+(x-9)+" "+(FLOOR-90)+" l-4 26 M"+(x+9)+" "+(FLOOR-90)+" l4 26",fill:"#6b7a45",stroke:"#55613a","stroke-width":3,"stroke-linejoin":"round"},svg);}
    var jA=jacket(230),jB=jacket(250);
    /* the demarcation line */
    var demo=el("line",{x1:20,y1:FLOOR+16,x2:460,y2:FLOOR+16,stroke:"#e0473c","stroke-width":3,"stroke-dasharray":"10 7",opacity:0},svg);
    var demoTxt=el("text",{x:240,y:FLOOR+34,"text-anchor":"middle",fill:"#e0473c","font-size":9,"letter-spacing":"2",opacity:0},svg);demoTxt.textContent="ДЕМАРКАЦІЙНА ЛІНІЯ · НЕ ПЕРЕТИНАТИ";
    var ag=el("g",{},svg),bg=el("g",{},svg),AR=rig(ag),BR=rig(bg);
    /* the guard: a goose in a helmet */
    var goose=el("g",{opacity:0},svg);
    el("ellipse",{cx:0,cy:-14,rx:20,ry:12,fill:"#f2f2ee"},goose);
    el("path",{d:"M-18 -16 l-8 -6 l4 9 z",fill:"#d9d9d2"},goose);
    var neck=el("path",{fill:"none",stroke:"#f2f2ee","stroke-width":7,"stroke-linecap":"round"},goose);
    var ghead=el("g",{},goose);
    el("circle",{cx:0,cy:0,r:6,fill:"#f2f2ee"},ghead);
    var beak=el("path",{d:"M5 -1 l9 2 l-9 2 z",fill:"#f08a24"},ghead);
    el("circle",{cx:2,cy:-2,r:1.2,fill:"#111"},ghead);
    el("path",{d:"M-7 -3 A7 7 0 0 1 7 -3 L10 -1 L-7 -1 Z",fill:"#5b6b3e",stroke:"#3d4829","stroke-width":1},ghead);
    var gl1=el("line",{x1:-3,y1:-3,x2:-5,y2:8,stroke:"#f08a24","stroke-width":2.5,"stroke-linecap":"round"},goose),gl2=el("line",{x1:5,y1:-3,x2:7,y2:8,stroke:"#f08a24","stroke-width":2.5,"stroke-linecap":"round"},goose);
    var hiss=el("text",{"text-anchor":"start",fill:"#ffdf6e","font-size":20,"font-weight":"700",opacity:0},svg);hiss.textContent="ШШШ!";
    /* snow */
    var snow=el("g",{},svg),flakes=[];for(var s2=0;s2<40;s2++){flakes.push([Math.random()*480,Math.random()*270,.4+Math.random()*.9,el("circle",{r:(.8+Math.random()*1.3).toFixed(1),fill:"#fff",opacity:(.35+Math.random()*.5).toFixed(2)},snow)]);}
    var capT=el("text",{x:240,y:28,"text-anchor":"middle",fill:"#eef3f6","font-size":15,"font-weight":"700"},svg);
    var dark=el("rect",{x:0,y:0,width:480,height:270,fill:"#000",opacity:0,"pointer-events":"none"},svg);

    var bar=document.createElement("div");bar.className="bar";
    bar.innerHTML='<button type="button" class="pl">▶ Нейровайб</button><span class="tm">0:00 / 0:'+DUR+'</span><button type="button" class="snd" aria-pressed="true">🔊 звук</button>';
    box.appendChild(bar);
    var cover=document.createElement("div");cover.className="cover";
    cover.innerHTML='<i aria-hidden="true">▶</i><b>Нейровайб: тактичний маневр по куртку</b><span>26 секунд · зі звуком · не обговорюється</span>';
    box.appendChild(cover);
    var pl=bar.querySelector(".pl"),tm=bar.querySelector(".tm"),sb=bar.querySelector(".snd");
    var snd=new Sound(),mute=false;try{mute=localStorage.getItem("vv-kurtka-mute")==="1";}catch(e){}
    function paintSnd(){sb.textContent=mute?"🔇 без звуку":"🔊 звук";sb.setAttribute("aria-pressed",String(!mute));}paintSnd();
    var playing=false,t0=0,tNow=0,raf=0,fired={},lastStep={a:0,b:0};
    sb.onclick=function(){mute=!mute;try{localStorage.setItem("vv-kurtka-mute",mute?"1":"0");}catch(e){}paintSnd();if(mute)snd.stopAll();else if(playing)snd.windOn();};

    function frame(t){
      tNow=t;
      dress(AR,t>=13.1);dress(BR,t>=5.5);
      var ap=soldierA(t),bp=soldierB(t);draw(AR,ap);draw(BR,bp);
      jB.setAttribute("opacity",t>=5.5?"0":"1");jA.setAttribute("opacity",t>=13.1?"0":"1");
      /* the line draws itself from the middle out */
      var d=clamp((t-15)/1.4);demo.setAttribute("opacity",d>0?"1":"0");
      demo.setAttribute("x1",(240-220*d).toFixed(1));demo.setAttribute("x2",(240+220*d).toFixed(1));demoTxt.setAttribute("opacity",clamp((t-16.2)/.5).toFixed(2));
      /* the goose marches in, stretches its neck and hisses, then patrols */
      var gi=clamp((t-16.6)/1.6),gx=lerp(500,300,ease(gi)),patrol=t>19.2?Math.sin((t-19.2)*1.1)*26:0,gxx=gx+patrol;
      var stretch=t>=18.3&&t<19.3?ease(clamp((t-18.3)/.25))*(1-clamp((t-19)/.3)):0,gdir=t>19.2&&Math.cos((t-19.2)*1.1)>0?1:-1;if(t<=19.2)gdir=-1;
      goose.setAttribute("opacity",t>=16.6?"1":"0");
      var bob=Math.abs(Math.sin(t*8))*(gi<1||t>19.2?2:0);
      goose.setAttribute("transform","translate("+gxx.toFixed(1)+" "+(FLOOR+2-bob).toFixed(1)+") scale("+(gdir*1.5)+" 1.5)");
      var hx=10+stretch*16,hy=-36+stretch*22;
      neck.setAttribute("d","M12 -18 Q"+(14+stretch*6).toFixed(1)+" "+(-28+stretch*8).toFixed(1)+" "+hx.toFixed(1)+" "+hy.toFixed(1));
      ghead.setAttribute("transform","translate("+hx.toFixed(1)+" "+hy.toFixed(1)+")");
      beak.setAttribute("d",stretch>.5?"M5 -2 l10 0 l-10 2 l10 3 l-10 -1 z":"M5 -1 l9 2 l-9 2 z");
      var sw=Math.sin(t*8);gl1.setAttribute("x2",(-5+sw*3).toFixed(1));gl2.setAttribute("x2",(7-sw*3).toFixed(1));
      hiss.setAttribute("opacity",stretch>.5?"1":"0");hiss.setAttribute("x",(gxx-95).toFixed(1));hiss.setAttribute("y",(FLOOR-62).toFixed(1));
      /* the rest walk to the house */
      var r=clamp((t-19.2)/4.6);rest.setAttribute("opacity",t>=19.2&&t<24.4?String(Math.min(1,(t-19.2)*2)):"0");
      restP.forEach(function(q,i){var x=lerp(150-i*26,372+i*2,ease(clamp(r*1.05-i*.06))),y=FLOOR-44,w=Math.sin(t*9+i)*3;q[0].setAttribute("transform","translate("+x.toFixed(1)+" "+y+")");q[1].setAttribute("x2",(-w).toFixed(1));q[2].setAttribute("x2",w.toFixed(1));});
      winGlow.setAttribute("opacity",(.12+.06*Math.sin(t*2)+(t>23?.12:0)).toFixed(2));
      flakes.forEach(function(f){var y=(f[1]+t*22*f[2])%280-5,x=(f[0]+Math.sin(t*.8+f[1])*6+t*6*f[2])%490;f[3].setAttribute("cx",x.toFixed(1));f[3].setAttribute("cy",y.toFixed(1));});
      capT.textContent=cap(t);
      dark.setAttribute("opacity",(clamp((t-24.4)/1.4)*.55).toFixed(2));
      tm.textContent="0:"+String(Math.floor(t)).padStart(2,"0")+" / 0:"+DUR;
      if(!mute&&playing){
        if(t>=5.5&&!fired.zb){fired.zb=1;snd.zip();}
        if(t>=13.1&&!fired.za){fired.za=1;snd.zip();}
        var walkB=(t>=4&&t<5)||(t>=6&&t<8.6),walkA=(t>=11.6&&t<12.6)||(t>=13.6&&t<15);
        if(walkB&&t-lastStep.b>.36){lastStep.b=t;snd.step();}
        if(walkA&&t-lastStep.a>.36){lastStep.a=t;snd.step();}
        if(t>=15.2&&!fired.wo){fired.wo=1;snd.windOff();}
        if(t>=17.2&&!fired.h1){fired.h1=1;snd.honk(false);}
        if(t>=18.35&&!fired.h2){fired.h2=1;snd.honk(true);}
        if(t>=25&&!fired.h3){fired.h3=1;snd.honk(false);}
      }
    }
    function tick(now){if(!playing)return;var t=(now-t0)/1000;if(t>=DUR){frame(DUR);stop(true);return;}frame(t);raf=requestAnimationFrame(tick);}
    function play(){cover.hidden=true;fired={};lastStep={a:0,b:0};if(tNow>=DUR-.01)tNow=0;if(tNow<15)fired.wo=0;
      t0=performance.now()-tNow*1000;playing=true;pl.textContent="❚❚ пауза";if(!mute&&tNow<15)snd.windOn();raf=requestAnimationFrame(tick);}
    function stop(done){playing=false;cancelAnimationFrame(raf);snd.stopAll();pl.textContent=done?"↺ ще раз":"▶ далі";if(done)tNow=DUR;}
    pl.onclick=function(){if(playing)stop(false);else play();};
    cover.onclick=play;
    var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    frame(reduce?DUR:0);if(reduce)tNow=DUR;
    if("IntersectionObserver" in window)new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting&&playing)stop(false);});},{threshold:.2}).observe(box);
    document.addEventListener("visibilitychange",function(){if(document.hidden&&playing)stop(false);});
    box.__kurtkaApi={frame:frame,play:play};
  };
  function mountAll(){[].forEach.call(document.querySelectorAll(".kurtka-stage"),function(x){window.VV_KURTKA(x);});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountAll);else mountAll();
})();
