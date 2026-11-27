/* «Аква віта» — нейровайб для 97.7 FM «Жіньмінь Жібао». Вода життя в етно-хаос дусі:
   бубон у 7/8 (3+2+2), віолончельний бурдон, краплі води, гармошка й сопілка в українському дорійському ладі.
   Усе пишеться наживо в браузері: жодних семплів, записів чи чужих голосів. Оригінал пісні слухай в авторів.
   Три розділи по колу: «Вода» → «Бубон» → «Злива».
   VV_AKVAVITA.make(ctx, out) → {schedule(now), stop(), info()} — schedule() кожні ~100 мс. */
(function(){
  "use strict";
  if(window.VV_AKVAVITA)return;
  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  function rnd(a){return a[Math.floor(Math.random()*a.length)];}
  var SECTIONS=["Вода","Бубон","Злива"];
  /* Ukrainian Dorian on D: D E F G# A B C */
  var LAD=[0,2,3,6,7,9,10];
  var ROOTS=[50,48,52];var NAMES={50:"ре",48:"до",52:"мі"};
  var KICK=[1,0,0,1,0,1,0], SHAK=[.5,.25,.35,.5,.25,.5,.3];   /* 3+2+2 */

  window.VV_AKVAVITA={make:function(ctx,out){
    var bus=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),rev=ctx.createConvolver();
    var len=Math.floor(ctx.sampleRate*3.2),ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
    rev.buffer=ir;dry.gain.value=.85;wet.gain.value=.32;bus.gain.value=.8;
    bus.connect(dry);bus.connect(rev);rev.connect(wet);dry.connect(out);wet.connect(out);
    var nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),nd=nb.getChannelData(0);for(var k=0;k<nd.length;k++)nd[k]=Math.random()*2-1;
    var live=[];function keep(n,end){live.push({n:n,end:end});}

    function env(g,t,a,v,dur,rel){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+Math.max(a,dur));g.gain.exponentialRampToValueAtTime(.0001,t+dur+rel);}
    function kick(t,v){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);
      env(g,t,.004,v,.05,.35);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.5);keep(o,t+.5);}
    function shaker(t,v){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=nb;f.type="highpass";f.frequency.value=6500;
      env(g,t,.003,v*.09,.01,.07);s.connect(f);f.connect(g);g.connect(bus);s.start(t,Math.random()*.5,.12);keep(s,t+.12);}
    function drop(t){   /* a water drop: a sine that falls into the surface, then a ripple */
      var m=rnd([84,86,88,91,93,96]),o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";
      o.frequency.setValueAtTime(mtof(m)*.7,t);o.frequency.exponentialRampToValueAtTime(mtof(m)*1.6,t+.05);
      env(g,t,.002,.09,.01,.18);o.connect(g);g.connect(bus);o.start(t);o.stop(t+.25);keep(o,t+.25);}
    function drone(t,root,dur,v){   /* cello bourdon: root + fifth, a slow bow */
      [root-12,root-5].forEach(function(m,i){var o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sawtooth";
        o.frequency.value=mtof(m)*(i?1.002:1);lp.type="lowpass";lp.frequency.value=520;lp.Q.value=.6;
        env(g,t,dur*.35,v*(i?.6:1),dur*.6,dur*.4);o.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o.stop(t+dur*1.05);keep(o,t+dur*1.05);});}
    function garmoshka(t,ms,dur,v){   /* reedy chord: detuned pulse pairs through a nasal band */
      var bp=ctx.createBiquadFilter(),g=ctx.createGain();bp.type="bandpass";bp.frequency.value=1100;bp.Q.value=.7;env(g,t,.06,v,dur,.15);bp.connect(g);g.connect(bus);
      ms.forEach(function(m){[-6,6].forEach(function(ce){var o=ctx.createOscillator();o.type="square";o.frequency.value=mtof(m)*Math.pow(2,ce/1200);o.connect(bp);o.start(t);o.stop(t+dur+.2);keep(o,t+dur+.2);});});}
    function sopilka(t,m,dur,v){   /* wooden flute: soft triangle, breath noise, a little vibrato late in the note */
      var o=ctx.createOscillator(),g=ctx.createGain(),vb=ctx.createOscillator(),vg=ctx.createGain();o.type="triangle";o.frequency.value=mtof(m);
      vb.frequency.value=5.5;vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(mtof(m)*.008,t+dur);vb.connect(vg);vg.connect(o.frequency);
      env(g,t,.03,v,dur*.8,.12);o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.2);vb.start(t);vb.stop(t+dur+.2);keep(o,t+dur+.2);
      var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),bg=ctx.createGain();s.buffer=nb;f.type="bandpass";f.frequency.value=mtof(m)*2;f.Q.value=3;
      env(bg,t,.02,v*.25,.05,.1);s.connect(f);f.connect(bg);bg.connect(bus);s.start(t,Math.random()*.5,.25);keep(s,t+.25);}

    var BPM=104,EIGHTH=60/BPM/2,BAR=7;
    var next=ctx.currentTime+.1,step=0,bar=0,sec=0,root=50,phrase=[],dead=false;
    function scaleNote(deg){var o=Math.floor(deg/7),i=((deg%7)+7)%7;return root+12+o*12+LAD[i];}
    function newPhrase(){var p=[],deg=rnd([0,2,4]),n=rnd([5,6,7]);for(var i=0;i<n;i++){deg+=rnd([-1,-1,1,1,2,-2,0]);deg=Math.max(-2,Math.min(9,deg));p.push({deg:deg,len:rnd([1,2,2,3])});}p[p.length-1].deg=rnd([0,4,7]);return p;}
    var mel=null,melAt=0;

    function tick(t){
      var s=step%BAR,S=SECTIONS[sec];
      if(s===0){
        if(bar%4===0)drone(t,root,EIGHTH*BAR*4,.07);
        if(S==="Злива"&&bar%2===0){var c=bar%4===0?[root+12,root+15,root+19]:[root+10,root+14,root+17];garmoshka(t,c,EIGHTH*BAR*2-.1,.035);}
        if(S!=="Вода"&&bar%2===1&&!mel){mel=newPhrase();melAt=0;}
      }
      if(S!=="Вода"){if(KICK[s])kick(t,s===0?.55:.38);shaker(t,SHAK[s]);}
      if(Math.random()<(S==="Вода"?.32:S==="Злива"?.22:.12))drop(t+Math.random()*EIGHTH*.5);
      if(mel){if(melAt<=0){var n=mel.shift();if(n){sopilka(t,scaleNote(n.deg),EIGHTH*n.len*.95,S==="Злива"?.11:.08);melAt=n.len;}else mel=null;}melAt--;}
      step++;if(step%BAR===0){bar++;if(bar%16===0){sec=(sec+1)%SECTIONS.length;if(sec===0)root=rnd(ROOTS);}}
    }
    return {
      schedule:function(now){if(dead)return;now=now||ctx.currentTime;if(next<now-.5)next=now+.05;while(next<now+.25){tick(next);next+=EIGHTH;}
        var t=ctx.currentTime;live=live.filter(function(x){return x.end>t;});},
      stop:function(){dead=true;live.forEach(function(x){try{x.n.stop();}catch(e){}});live=[];try{bus.disconnect();}catch(e){}},
      info:function(){return {section:SECTIONS[sec],key:NAMES[root]+" дорійський",bar:bar};}
    };
  }};
})();
