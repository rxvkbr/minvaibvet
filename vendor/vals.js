/* «Туман і вальс» — 90.5 FM: Чайковський, Дебюссі, Перселл.
   Three sections that keep turning, written live, nothing sampled or quoted:
   · «Граунд Перселла»  — a ground bass (the chromatic lament tetrachord in 3/2) repeating under new variations each time;
   · «Туман Дебюссі»    — whole-tone and pentatonic colours, parallel ninth chords that glide, harp, a held pedal;
   · «Вальс Чайковського» — 3/4: bass, chord, chord; a long singing string melody with sequences, and a celesta.
   VV_VALS.make(ctx, out) → {schedule(now), stop(), info()} — call schedule() every ~100 ms. */
(function(){
  "use strict";
  if(window.VV_VALS)return;
  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  function rnd(a){return a[Math.floor(Math.random()*a.length)];}
  var SECTIONS=["Граунд Перселла","Туман Дебюссі","Вальс Чайковського"];
  var KEYS=[62,67,64,60,65];   /* D, G, E, C, F */
  var NAMES={60:"до",62:"ре",64:"мі",65:"фа",67:"соль"};

  window.VV_VALS={make:function(ctx,out){
    var bus=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),rev=ctx.createConvolver();
    var len=Math.floor(ctx.sampleRate*3.8),ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);}
    rev.buffer=ir;dry.gain.value=.7;wet.gain.value=.5;bus.gain.value=.85;
    bus.connect(dry);bus.connect(rev);rev.connect(wet);dry.connect(out);wet.connect(out);

    /* ---- instruments ---- */
    function strings(t,m,vel,dur){   /* a small section: three detuned saws, slow bow, soft top */
      var g=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=Math.min(5000,mtof(m)*4);lp.Q.value=.4;
      var att=Math.min(.35,dur*.3);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+att);g.gain.setValueAtTime(vel,t+dur*.85);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.4);
      [-7,0,6].forEach(function(cents){var o=ctx.createOscillator();o.type="sawtooth";o.frequency.value=mtof(m)*Math.pow(2,cents/1200);
        var v=ctx.createOscillator(),vg=ctx.createGain();v.frequency.value=5.2;vg.gain.value=mtof(m)*.004;v.connect(vg);vg.connect(o.frequency);   /* vibrato */
        o.connect(lp);o.start(t);o.stop(t+dur+.5);v.start(t);v.stop(t+dur+.5);});
      var sc=ctx.createGain();sc.gain.value=.22;lp.connect(sc);sc.connect(g);g.connect(bus);
    }
    function celesta(t,m,vel){   /* bright bell over a soft hammer */
      var f=mtof(m);[[1,1,1.6],[4,.25,.5],[10.2,.06,.2]].forEach(function(p){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f*p[0];
        g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel*p[1],t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+p[2]);o.connect(g);g.connect(bus);o.start(t);o.stop(t+p[2]+.05);});
    }
    function harp(t,m,vel){
      var f=mtof(m),o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();
      o.type="triangle";o.frequency.value=f;o2.type="sine";o2.frequency.value=f*2;lp.type="lowpass";lp.frequency.setValueAtTime(f*8,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+.6);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);
      var g2=ctx.createGain();g2.gain.value=.3;o.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o2.start(t);o.stop(t+1.9);o2.stop(t+1.9);
    }
    function harpsi(t,m,vel){   /* a plucked continuo for the ground */
      var f=mtof(m),o=ctx.createOscillator(),g=ctx.createGain(),hp=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.value=f;hp.type="highpass";hp.frequency.value=f*.8;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(hp);hp.connect(g);g.connect(bus);o.start(t);o.stop(t+1);
    }
    function bass(t,m,vel,dur){var o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.value=mtof(m);lp.type="lowpass";lp.frequency.value=600;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(lp);lp.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.05);}

    var tonic=rnd(KEYS),section=0,phraseN=0,next=ctx.currentTime+.2,beat=0,lastMel=0;
    var MAJ=[0,2,4,5,7,9,11],MIN=[0,2,3,5,7,8,10],WT=[0,2,4,6,8,10],PENT=[0,2,4,7,9];
    function deg(scale,d,base){var o=Math.floor(d/scale.length),r=((d%scale.length)+scale.length)%scale.length;return base+o*12+scale[r];}

    /* Purcell: the ground — tonic, down by semitones to the dominant, then a cadence; 6 bars of 3 minims */
    var GROUND=[0,-1,-2,-3,-4,-5,-5,-7];   /* D C# C B Bb A … A, D (lament tetrachord in minor) */
    var melody=[];
    function newMelody(){melody=[];var d=4;for(var i=0;i<24;i++){d+=rnd([-1,1,-1,1,2,-2,0]);d=Math.max(0,Math.min(9,d));melody.push(d);}melody[23]=0;}
    newMelody();

    /* Tchaikovsky: a waltz progression in the major, I–vi–ii–V, with a sequence up a step in the second half */
    var WALTZ=[[0,4,7],[9,0,4],[2,5,9],[7,11,2],[0,4,7],[5,9,0],[7,11,2,5],[0,4,7]];

    function step(t){
      var sec=SECTIONS[section],b=beat;
      if(sec==="Граунд Перселла"){
        /* 3/2: each bar three minims; the ground note on the first, a continuo chord on all three */
        var bar=Math.floor(b/3)%8,pos=b%3,gnd=tonic-24+GROUND[bar];
        if(pos===0){bass(t,gnd,.18,2.4);bass(t,gnd+12,.06,2);}
        var chord=[gnd+12+3,gnd+12+7].map(function(x){return x;});
        harpsi(t,gnd+24,.05);harpsi(t+.02,gnd+27+(bar%2),.04);
        var mi=(Math.floor(b/3)*3+pos)%24,mel=deg(MIN,melody[mi],tonic+12);
        strings(t,mel,.09,.95);lastMel=mel;
        return .78;   /* a slow minim */
      }
      if(sec==="Туман Дебюссі"){
        /* planing: a ninth chord gliding in parallel over the whole-tone scale; harp arpeggios in pentatonic; a held pedal */
        var bar2=Math.floor(b/4),pos2=b%4,root=deg(WT,(bar2*2+(bar2%3))%6,tonic);
        if(pos2===0){bass(t,tonic-24,.1,4);[0,4,7,10,14].forEach(function(iv,i){strings(t+i*.05,root+iv-12,.035,3.2);});}
        for(var k=0;k<3;k++)harp(t+k*.11,deg(PENT,(b*3+k)%10,tonic+12),.05);
        if(pos2===2&&Math.random()<.6)celesta(t+.2,deg(WT,Math.floor(Math.random()*8),tonic+24),.05);
        return .62;
      }
      /* Tchaikovsky waltz: 3/4 — bass on one, chord on two and three; melody in long notes with a lift */
      var bar3=Math.floor(b/3)%8,pos3=b%3,ch=WALTZ[bar3],root3=tonic+ch[0];
      if(pos3===0){bass(t,root3-24,.2,.5);bass(t,root3-12,.05,.4);}
      else ch.forEach(function(iv,i){harp(t+i*.01,tonic+iv+(iv<5?12:0),.045);});
      if(pos3===0){var target=deg(MAJ,(bar3===7?7:[2,4,1,4,2,5,6,0][bar3]+((Math.floor(b/24)%2)?1:0)),tonic+12);
        strings(t,target,.12,bar3===7?2.6:1.25);lastMel=target;}
      if(pos3===2&&bar3%2===1)strings(t,lastMel+rnd([2,-1,3]),.08,.45);
      if(pos3===1&&Math.random()<.35)celesta(t,lastMel+12,.045);
      return .42;   /* a lilting tempo, a little faster on beat three */
    }
    var stopped=false;
    return {
      schedule:function(now){
        if(stopped)return;if(next<now)next=now+.05;
        while(next<now+.3){
          var len=step(next);next+=len;beat++;
          var phraseLen=section===0?24:section===1?24:24;
          if(beat>=phraseLen){beat=0;phraseN++;newMelody();
            if(phraseN%2===0){section=(section+1)%3;if(Math.random()<.5){var c2=KEYS.filter(function(k){return k!==tonic;});tonic=rnd(c2);}}}
        }
      },
      stop:function(){stopped=true;try{bus.disconnect();}catch(e){}},
      info:function(){return {section:SECTIONS[section],key:(NAMES[tonic]||"")+(section===0?"-мінор":"-мажор")};}
    };
  }};
})();
