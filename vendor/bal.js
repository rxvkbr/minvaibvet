/* «Бал для одного глядача» — уявний вогінг у вітальні в Абкауде.
   Two line figures (no likeness of anyone): козак dances, the judge on the sofa scores.
   VV_BAL(el) turns any element into the little stage with ▶ and 🔊. Everything is drawn locally;
   the beat is synthesised with Web Audio (so the app-wide volume knob applies). */
(function(){
  "use strict";
  if(window.VV_BAL)return;
  var NS="http://www.w3.org/2000/svg",FLOOR=232,DUR=24;
  var CSS=".bal{position:relative;border-radius:16px;overflow:hidden;background:radial-gradient(ellipse at 30% 0,#3a2a52,#141019 70%);border:1px solid #ffffff1a;margin:1.4em 0;font-family:ui-monospace,Menlo,monospace;user-select:none;-webkit-user-select:none}"+
    ".bal svg{display:block;width:100%;height:auto}"+
    ".bal .bar{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:8px 10px;background:#0006;font-size:12px;color:#cdbfa6}"+
    ".bal button{font:inherit;color:#f6ead2;background:#ffffff14;border:1px solid #ffffff26;border-radius:999px;padding:6px 12px;cursor:pointer}"+
    ".bal .cover{position:absolute;inset:0 0 40px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0b0810b0;color:#f6ead2;cursor:pointer;text-align:center;padding:10px}"+
    ".bal .cover b{font:700 20px Georgia,serif}.bal .cover span{font-size:12px;color:#cdbfa6}.bal .cover i{font-style:normal;font-size:34px;width:64px;height:64px;border-radius:50%;background:#e8c46a;color:#1a1408;display:grid;place-items:center;padding-left:4px}"+
    ".bal .cover[hidden]{display:none}";
  function css(){if(document.getElementById("bal-css"))return;var s=document.createElement("style");s.id="bal-css";s.textContent=CSS;document.head.appendChild(s);}
  function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
  function lerp(a,b,k){return a+(b-a)*k;}
  function ease(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}
  function v(a,l){var r=a*Math.PI/180;return [Math.sin(r)*l,Math.cos(r)*l];}   /* angle 0 = straight down, 90 = to the right */

  /* ---- a rig: hip, torso, head, two arms, two legs ---- */
  var L={t:50,ua:27,fa:25,th:40,sh:40,head:11};
  function rig(g,col,w){
    var o={g:g};
    o.parts=["torso","la1","la2","ra1","ra2","ll1","ll2","rl1","rl2"].reduce(function(m,k){m[k]=el("line",{stroke:col,"stroke-width":w,"stroke-linecap":"round"},g);return m;},{});
    o.head=el("circle",{r:L.head,fill:"none",stroke:col,"stroke-width":w},g);
    o.extra=el("g",{},g);
    return o;
  }
  function draw(o,p){
    var hx=p.x,hy=p.y,t=p.t||0,nk=[hx+Math.sin(t*Math.PI/180)*L.t,hy-Math.cos(t*Math.PI/180)*L.t];
    function seg(name,a,b){var e=o.parts[name];e.setAttribute("x1",a[0].toFixed(1));e.setAttribute("y1",a[1].toFixed(1));e.setAttribute("x2",b[0].toFixed(1));e.setAttribute("y2",b[1].toFixed(1));}
    seg("torso",[hx,hy],nk);
    var sh=[nk[0]-Math.sin(t*Math.PI/180)*6,nk[1]+Math.cos(t*Math.PI/180)*6];
    function limb(n1,n2,o0,a1,a2,l1,l2){var d1=v(a1,l1),j=[o0[0]+d1[0],o0[1]+d1[1]],d2=v(a2,l2),e=[j[0]+d2[0],j[1]+d2[1]];seg(n1,o0,j);seg(n2,j,e);return e;}
    var lh=limb("la1","la2",sh,p.la1,p.la2,L.ua,L.fa),rh=limb("ra1","ra2",sh,p.ra1,p.ra2,L.ua,L.fa);
    limb("ll1","ll2",[hx,hy],p.ll1,p.ll2,L.th,L.sh);limb("rl1","rl2",[hx,hy],p.rl1,p.rl2,L.th,L.sh);
    var hd=[nk[0]+Math.sin((t+(p.chin||0))*Math.PI/180)*(L.head+2),nk[1]-Math.cos((t+(p.chin||0))*Math.PI/180)*(L.head+2)];
    o.head.setAttribute("cx",hd[0].toFixed(1));o.head.setAttribute("cy",hd[1].toFixed(1));
    o.g.setAttribute("transform","rotate("+(p.rot||0).toFixed(1)+" "+hx.toFixed(1)+" "+hy.toFixed(1)+")"+(p.sx!=null&&p.sx!==1?" translate("+hx+" 0) scale("+p.sx.toFixed(3)+" 1) translate("+(-hx)+" 0)":""));
    return {lh:lh,rh:rh,head:hd};
  }
  var KEYS=["x","y","t","chin","la1","la2","ra1","ra2","ll1","ll2","rl1","rl2","rot","sx"];
  function mix(a,b,k){var o={};KEYS.forEach(function(n){var x=a[n]==null?(n==="sx"?1:0):a[n],y=b[n]==null?(n==="sx"?1:0):b[n];o[n]=lerp(x,y,k);});return o;}
  function P(o){return Object.assign({x:70,y:FLOOR-80,t:0,chin:0,la1:-12,la2:-6,ra1:12,ra2:6,ll1:-5,ll2:-3,rl1:5,rl2:3,rot:0,sx:1},o);}

  /* козак: keyframes [time, pose]; walk and duck add procedural steps on top */
  var STAND=P({}),
    WALK_END=P({x:230,ra1:35,ra2:-70,chin:-8}),
    H1=P({x:230,la1:-130,la2:-175,ra1:130,ra2:175,chin:-6}),
    H2=P({x:230,la1:150,la2:95,ra1:-150,ra2:-95,t:-4}),
    H3=P({x:230,la1:95,la2:175,ra1:-60,ra2:30,t:6}),
    FRAME=P({x:232,t:4,la1:70,la2:160,ra1:115,ra2:25,chin:4}),
    DUCK=P({x:250,y:FLOOR-48,t:12,ll1:95,ll2:-8,rl1:80,rl2:4,la1:-100,la2:-80,ra1:105,ra2:85}),
    DUCK_END=P({x:300,y:FLOOR-48,t:12,ll1:95,ll2:-8,rl1:80,rl2:4,la1:-100,la2:-80,ra1:105,ra2:85}),
    SPIN=P({x:300,la1:-172,la2:-180,ra1:172,ra2:180,chin:-10}),
    DIP=P({x:282,y:FLOOR-9,rot:-84,t:0,la1:-160,la2:-175,ra1:60,ra2:90,ll1:-70,ll2:-95,rl1:8,rl2:4,chin:10}),
    KNEE=P({x:300,y:FLOOR-42,t:-6,ll1:-8,ll2:-90,rl1:88,rl2:2,la1:-20,la2:-10,ra1:150,ra2:170}),
    RISE=P({x:322,y:FLOOR-80,t:-4,la1:-15,la2:-8,ra1:175,ra2:178,chin:-10}),
    OFFER=P({x:334,y:FLOOR-80,t:6,la1:-15,la2:-8,ra1:112,ra2:100,chin:4,ll1:-8,rl1:10});
  var K=[[0,STAND],[4,WALK_END],[4.6,H1],[5.6,H2],[6.6,H3],[7.6,FRAME],[8.4,FRAME],[9,DUCK],[11.6,DUCK_END],[12,SPIN],[13.4,SPIN],[13.75,P({x:292,y:FLOOR-60,rot:-40,la1:-160,la2:-175,ra1:60,ra2:90,ll1:-40,ll2:-60,rl1:20,rl2:10})],[14.1,DIP],[19.2,DIP],[20.1,KNEE],[21,RISE],[22.2,OFFER],[DUR,OFFER]];
  function kozak(t){
    var i=0;while(i<K.length-2&&t>K[i+1][0])i++;
    var a=K[i],b=K[i+1],k=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]||1))),p=mix(a[1],b[1],ease(k));
    if(t<4){var ph=t*Math.PI*2*1.1,s=Math.sin(ph);           /* catwalk: crossing steps, hip sway, hand on hip */
      p.x=lerp(70,230,t/4);p.ll1=22*s;p.ll2=p.ll1-Math.max(0,28*Math.sin(ph+.6));p.rl1=-22*s;p.rl2=p.rl1-Math.max(0,28*Math.sin(ph+Math.PI+.6));
      p.t=4*Math.sin(ph*.5);p.la1=-14*s-6;p.la2=p.la1-10;p.ra1=35;p.ra2=-70;p.chin=-8;p.y=FLOOR-80-Math.abs(Math.cos(ph))*2;}
    if(t>=9&&t<11.6){var q=Math.sin((t-9)*Math.PI*2*1.6);   /* duckwalk: little kicks and flapping hands */
      p.ll1=95+q*14;p.rl1=80-q*14;p.la2=-80+q*30;p.ra2=85-q*30;}
    if(t>=12&&t<13.4){p.sx=Math.cos((t-12)*Math.PI*2*2.2);}   /* spin */
    if(t>=13.4&&t<14.1){p.sx=1;}
    return p;
  }
  /* the judge on the sofa */
  var JS=P({x:420,y:FLOOR-48,t:-6,ll1:-92,ll2:0,rl1:-88,rl2:4,la1:-40,la2:-150,ra1:-20,ra2:-140,chin:-4}),
    JLAUGH=P({x:420,y:FLOOR-48,t:-18,ll1:-140,ll2:-60,rl1:-130,rl2:-50,la1:-40,la2:-150,ra1:-20,ra2:-140,chin:-14}),
    JLEAN=P({x:418,y:FLOOR-48,t:-30,ll1:-92,ll2:0,rl1:-88,rl2:4,la1:-60,la2:-90,ra1:20,ra2:60,chin:0}),
    JTEN=P({x:420,y:FLOOR-48,t:-8,ll1:-92,ll2:0,rl1:-88,rl2:4,la1:-150,la2:-175,ra1:-115,ra2:-170,chin:-6}),
    JTAKE=P({x:420,y:FLOOR-48,t:-14,ll1:-92,ll2:0,rl1:-88,rl2:4,la1:-30,la2:-20,ra1:-85,ra2:-95,chin:0});
  var J=[[0,JS],[10.2,JS],[10.7,JLAUGH],[11.6,JLAUGH],[12.1,JS],[16.2,JS],[16.9,JLEAN],[17.4,JTEN],[19.4,JTEN],[20.4,JS],[22.2,JTAKE],[DUR,JTAKE]];
  function judge(t){var i=0;while(i<J.length-2&&t>J[i+1][0])i++;var a=J[i],b=J[i+1],k=Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0]||1)));return mix(a[1],b[1],ease(k));}

  var CAP=[[0,"Catwalk!"],[4.3,"Hands!"],[7.6,"…і в рамці — глядач"],[8.6,"Duckwalk!"],[10.4,"(глядач сміється)"],[11.9,"Spin!"],[13.5,"DIP!"],[14.6,"Тиша."],[15.7,"Чайник клацнув."],[16.9,"Tien."],[17.6,"Tien. Tien."],[18.3,"Tien. Tien. Tien."],[19.4,"Floor — підвестись хвилею"],[22.2,"…туди, де він може взяти руку"],[DUR,""]];
  function cap(t){var c="";for(var i=0;i<CAP.length;i++)if(t>=CAP[i][0])c=CAP[i][1];return c;}

  /* ---- sound: a soft ballroom beat, a kettle click, three little dings for the tens ---- */
  function Sound(){
    var ac=null,master=null,on=false,next=0,beat=0,BPM=104,timer=0;
    function ctx(){if(!ac){var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();master=ac.createGain();master.gain.value=.55;master.connect(ac.destination);}if(ac.state==="suspended")ac.resume();return ac;}
    function kick(t){var o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.16);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);}
    var nb=null;function noise(){if(nb)return nb;nb=ac.createBuffer(1,ac.sampleRate*.2,ac.sampleRate);var d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return nb;}
    function hat(t,lv,len){var s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise();f.type="highpass";f.frequency.value=7000;g.gain.setValueAtTime(lv,t);g.gain.exponentialRampToValueAtTime(.001,t+(len||.05));s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.2);}
    function clap(t){hat(t,.35,.12);hat(t+.012,.25,.1);}
    function tone(t,f,len,lv,type){var o=ac.createOscillator(),g=ac.createGain();o.type=type||"sine";o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(lv,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+len);o.connect(g);g.connect(master);o.start(t);o.stop(t+len+.05);}
    function bass(t,f){tone(t,f,.22,.28,"triangle");}
    var ROOT=[55,55,65.4,49];
    this.start=function(){if(!ctx())return;on=true;next=ac.currentTime+.05;beat=0;loop();};
    this.stop=function(){on=false;clearTimeout(timer);};
    this.quiet=false;
    var self=this;
    function loop(){
      if(!on)return;
      while(next<ac.currentTime+.15){
        if(!self.quiet){var b=beat%4;kick(next);hat(next+30/BPM,.18);if(b===1||b===3)clap(next);if(b===0||b===2)bass(next+30/BPM,ROOT[(beat>>2)%4]);}
        next+=60/BPM;beat++;
      }
      timer=setTimeout(loop,40);
    }
    this.click=function(){if(!ctx())return;var t=ac.currentTime;hat(t,.7,.03);tone(t,2400,.05,.15,"square");};
    this.ding=function(n){window.VV_TAPTIC&&VV_TAPTIC(n===2?"success":"click");if(!ctx())return;var t=ac.currentTime;tone(t,[880,1108.7,1318.5][n%3],.6,.25);};
    this.thud=function(){window.VV_TAPTIC&&VV_TAPTIC("heavy");if(!ctx())return;var t=ac.currentTime;tone(t,70,.3,.6);hat(t,.2,.08);};
  }

  window.VV_BAL=function(box){
    if(!box||box.__bal)return;box.__bal=1;css();
    box.classList.add("bal");
    var svg=el("svg",{viewBox:"0 0 480 270",role:"img","aria-label":"Анімація: козак танцює вогінг посеред кімнати, глядач на дивані ставить десять балів"},box);
    /* room */
    el("rect",{x:0,y:FLOOR,width:480,height:40,fill:"#00000040"},svg);
    el("line",{x1:0,y1:FLOOR,x2:480,y2:FLOOR,stroke:"#ffffff22"},svg);
    var spot=el("ellipse",{cx:200,cy:FLOOR+2,rx:60,ry:9,fill:"#e8c46a22"},svg);
    /* window with a little windmill */
    el("rect",{x:28,y:30,width:70,height:62,rx:4,fill:"#0d1830",stroke:"#ffffff22"},svg);
    var mill=el("g",{transform:"translate(63 66)"},svg);
    el("line",{x1:0,y1:0,x2:0,y2:22,stroke:"#cdbfa6","stroke-width":3},mill);
    var blades=el("g",{},mill);[0,90,180,270].forEach(function(a){el("rect",{x:-2,y:-20,width:4,height:20,fill:"#cdbfa6",transform:"rotate("+a+")"},blades);});
    /* backpack, kettle, speaker */
    el("rect",{x:120,y:FLOOR-26,width:18,height:26,rx:5,fill:"#4b6b48"},svg);
    el("rect",{x:150,y:150,width:60,height:6,fill:"#ffffff1a"},svg);
    el("path",{d:"M160 150 q0 -18 12 -18 q12 0 12 18 z",fill:"#9aa3ad"},svg);
    var kettle=el("circle",{cx:184,cy:142,r:2.4,fill:"#ff6b4a",opacity:.9},svg);
    el("rect",{x:195,y:136,width:10,height:14,rx:2,fill:"#2a2a33",stroke:"#ffffff33"},svg);
    /* sofa */
    el("rect",{x:378,y:FLOOR-58,width:96,height:22,rx:8,fill:"#5a3e6e"},svg);
    el("rect",{x:372,y:FLOOR-40,width:108,height:28,rx:8,fill:"#6d4c86"},svg);
    el("rect",{x:378,y:FLOOR-12,width:6,height:12,fill:"#3b2849"},svg);el("rect",{x:468,y:FLOOR-12,width:6,height:12,fill:"#3b2849"},svg);
    var table=el("rect",{x:448,y:FLOOR-30,width:26,height:4,fill:"#00000000"},svg);
    var jg=el("g",{},svg),kg=el("g",{},svg);
    var JR=rig(jg,"#9fd3ff",4),KR=rig(kg,"#f6ead2",4.2);
    var cup=el("g",{},svg);el("rect",{x:-5,y:-7,width:10,height:10,rx:2,fill:"#f6ead2"},cup);el("path",{d:"M5 -5 q5 0 5 4 q0 4 -5 4",fill:"none",stroke:"#f6ead2","stroke-width":1.6},cup);
    var steam=el("path",{d:"M-1 -10 q-3 -5 0 -9 q3 -4 0 -8",fill:"none",stroke:"#ffffff55","stroke-width":1.2},cup);
    var tens=el("g",{opacity:0},svg);
    function fingers(g){for(var i=-2;i<=2;i++)el("line",{x1:0,y1:0,x2:(i*4.2).toFixed(1),y2:-9,stroke:"#9fd3ff","stroke-width":2,"stroke-linecap":"round"},g);el("circle",{r:4,fill:"#9fd3ff"},g);}
    var fL=el("g",{},tens),fR=el("g",{},tens);fingers(fL);fingers(fR);
    var tenTxt=el("text",{x:420,y:58,"text-anchor":"middle",fill:"#e8c46a","font-family":"Georgia,serif","font-size":20,"font-weight":"700"},svg);
    var capT=el("text",{x:240,y:30,"text-anchor":"middle",fill:"#f6ead2","font-family":"ui-monospace,Menlo,monospace","font-size":17,"font-weight":"700","letter-spacing":"1"},svg);
    var dark=el("rect",{x:0,y:0,width:480,height:270,fill:"#000",opacity:0,"pointer-events":"none"},svg);
    var glow=el("circle",{r:18,fill:"#e8c46a",opacity:0,"pointer-events":"none"},svg);

    var bar=document.createElement("div");bar.className="bar";
    bar.innerHTML='<button type="button" class="pl">▶ Бал</button><span class="tm">0:00 / 0:'+DUR+'</span><button type="button" class="snd" aria-pressed="true">🔊 біт</button>';
    box.appendChild(bar);
    var cover=document.createElement("div");cover.className="cover";
    cover.innerHTML='<i aria-hidden="true">▶</i><b>Бал для одного глядача</b><span>уявний вогінг у вітальні · 24 секунди · зі звуком</span>';
    box.appendChild(cover);
    var pl=bar.querySelector(".pl"),tm=bar.querySelector(".tm"),sb=bar.querySelector(".snd");

    var snd=new Sound(),mute=false;try{mute=localStorage.getItem("vv-bal-mute")==="1";}catch(e){}
    function paintSnd(){sb.textContent=mute?"🔇 без звуку":"🔊 біт";sb.setAttribute("aria-pressed",String(!mute));}paintSnd();
    sb.onclick=function(){mute=!mute;try{localStorage.setItem("vv-bal-mute",mute?"1":"0");}catch(e){}paintSnd();if(mute)snd.stop();else if(playing)snd.start();};

    var playing=false,t0=0,tNow=0,raf=0,fired={};
    function frame(t){
      tNow=t;
      var kp=kozak(t),jp=judge(t),kk=draw(KR,kp),jj=draw(JR,jp);
      blades.setAttribute("transform","rotate("+(t*40).toFixed(1)+")");
      spot.setAttribute("cx",kp.x.toFixed(1));
      /* cup: in the judge's hand, on the table while scoring, back in hand at the end */
      var onTable=t>16.6&&t<20.4,cp=onTable?[461,FLOOR-34]:[jj.lh[0]+2,jj.lh[1]-2];
      cup.setAttribute("transform","translate("+cp[0].toFixed(1)+" "+cp[1].toFixed(1)+")");
      steam.setAttribute("opacity",(.4+.3*Math.sin(t*3)).toFixed(2));
      kettle.setAttribute("opacity",t>15.7&&t<16.2?"0.2":"0.9");
      var ten=t>=17.2&&t<19.6;tens.setAttribute("opacity",ten?"1":"0");
      if(ten){fL.setAttribute("transform","translate("+jj.lh[0].toFixed(1)+" "+jj.lh[1].toFixed(1)+")");fR.setAttribute("transform","translate("+jj.rh[0].toFixed(1)+" "+jj.rh[1].toFixed(1)+")");}
      tenTxt.textContent=t>=16.9&&t<19.6?["10","10 · 10","10 · 10 · 10"][t<17.6?0:t<18.3?1:2]:"";
      capT.textContent=cap(t);
      var end=Math.max(0,Math.min(1,(t-22.6)/1.2));
      dark.setAttribute("opacity",(end*.62).toFixed(2));
      glow.setAttribute("cx",kk.rh[0].toFixed(1));glow.setAttribute("cy",kk.rh[1].toFixed(1));glow.setAttribute("opacity",(end*.35).toFixed(2));
      tm.textContent="0:"+String(Math.floor(t)).padStart(2,"0")+" / 0:"+DUR;
      /* sound cues */
      if(!mute){
        if(t>=14.1&&!fired.thud){fired.thud=1;snd.thud();}
        if(t>=14.1&&!fired.q){fired.q=1;snd.quiet=true;}
        if(t>=15.7&&!fired.k){fired.k=1;snd.click();}
        [16.9,17.6,18.3].forEach(function(s,i){if(t>=s&&!fired["d"+i]){fired["d"+i]=1;snd.ding(i);}});
        if(t>=19.4&&!fired.back){fired.back=1;snd.quiet=false;}
      }
    }
    function tick(now){
      if(!playing)return;
      var t=(now-t0)/1000;
      if(t>=DUR){frame(DUR);stop(true);return;}
      frame(t);raf=requestAnimationFrame(tick);
    }
    function play(){
      cover.hidden=true;fired={};snd.quiet=false;
      if(tNow>=DUR-.01)tNow=0;
      t0=performance.now()-tNow*1000;playing=true;pl.textContent="❚❚ пауза";
      if(!mute)snd.start();
      raf=requestAnimationFrame(tick);
    }
    function stop(done){playing=false;cancelAnimationFrame(raf);snd.stop();pl.textContent=done?"↺ ще раз":"▶ далі";if(done)tNow=DUR;}
    pl.onclick=function(){if(playing)stop(false);else play();};
    cover.onclick=play;
    box.addEventListener("keydown",function(e){if(e.key===" "&&e.target===box){e.preventDefault();pl.onclick();}});
    /* reduced motion: show the last frame, still playable on request */
    frame(matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches?DUR:0);
    if(matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)tNow=DUR;
    /* stop when scrolled away or the page hides */
    if("IntersectionObserver" in window)new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting&&playing)stop(false);});},{threshold:.2}).observe(box);
    document.addEventListener("visibilitychange",function(){if(document.hidden&&playing)stop(false);});
    box.__balApi={frame:frame,play:play};
  };
})();
