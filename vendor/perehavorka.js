/* «Перегаворка» — резиденція діджеїв: безкінечний перехід від хайперпопу до подіуму.
   Нічого не семпловано й нікого не імітовано: усе синтезується наживо. Один бік — пружні металеві
   «гумові» синти, глісандо баса, блискучі мажорні акорди (дух хайперпопу); інший — вогінговий хаус:
   бочка «чотири на підлогу», клеп, відкритий хет, гуркіт на кожні вісім тактів і тихе «walk» на подіумі.
   Між ними повільно хитається ручка: ~3 хвилини туди, ~3 назад.
   VV_PEREHAVORKA.make(ctx, out) → {schedule(now), stop(), info()} — call schedule() every ~100 ms. */
(function(){
  "use strict";
  if(window.VV_PEREHAVORKA)return;
  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  var KEYS=[62,64,65,67,69],NAMES={62:"ре",64:"мі",65:"фа",67:"соль",69:"ля"};
  var noiseBuf=null;
  function noise(ctx){if(noiseBuf)return noiseBuf;var n=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=n.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return noiseBuf=n;}

  window.VV_PEREHAVORKA={make:function(ctx,out){
    var bus=ctx.createGain();bus.gain.value=.8;bus.connect(out);
    var pop=ctx.createGain(),run=ctx.createGain();pop.connect(bus);run.connect(bus);
    var t0=ctx.currentTime,next=t0+.05,step=0,bar=0,tonic=KEYS[Math.floor(Math.random()*KEYS.length)],stopped=false,lastWalk=-99;
    function morph(t){return (1-Math.cos(2*Math.PI*(t-t0)/360))/2;}   /* 0 = хайперпоп, 1 = подіум */
    function env(g,t,a,peak,d){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}

    /* ---- hyperpop side ---- */
    function rubber(t,m,v){ /* a bouncy sine with a fast pitch drop through a resonant bandpass */
      var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sine";
      o.frequency.setValueAtTime(mtof(m+12),t);o.frequency.exponentialRampToValueAtTime(mtof(m),t+.06);
      f.type="bandpass";f.Q.value=6;f.frequency.value=mtof(m)*3;env(g,t,.004,v,.18);
      o.connect(f);f.connect(g);g.connect(pop);var o2=ctx.createOscillator(),g2=ctx.createGain();o2.type="square";o2.frequency.value=mtof(m);env(g2,t,.004,v*.25,.12);o2.connect(g2);g2.connect(pop);
      o.start(t);o.stop(t+.3);o2.start(t);o2.stop(t+.2);}
    function metal(t,v){ /* FM bell-hit, glassy */
      var c=ctx.createOscillator(),mo=ctx.createOscillator(),mg=ctx.createGain(),g=ctx.createGain();c.frequency.value=mtof(tonic+31);mo.frequency.value=mtof(tonic+31)*3.53;mg.gain.value=900;
      mo.connect(mg);mg.connect(c.frequency);env(g,t,.002,v,.25);c.connect(g);g.connect(pop);c.start(t);mo.start(t);c.stop(t+.35);mo.stop(t+.35);}
    function glideBass(t,from,to,len,v){var o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sawtooth";
      o.frequency.setValueAtTime(mtof(from),t);o.frequency.exponentialRampToValueAtTime(mtof(to),t+len*.6);f.type="lowpass";f.frequency.value=700;f.Q.value=8;
      env(g,t,.01,v,len);o.connect(f);f.connect(g);g.connect(pop);o.start(t);o.stop(t+len+.05);}
    function sparkle(t,v){[0,4,7,11,14].forEach(function(iv,i){var o=ctx.createOscillator(),g=ctx.createGain();o.type="triangle";o.frequency.value=mtof(tonic+24+iv);env(g,t+i*.018,.003,v,.5);o.connect(g);g.connect(pop);o.start(t+i*.018);o.stop(t+i*.018+.6);});}

    /* ---- runway side ---- */
    function kick(t,v){var o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);env(g,t,.002,v,.32);o.connect(g);g.connect(run);o.start(t);o.stop(t+.4);}
    function hit(t,v,hp,dur,dest){var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise(ctx);f.type="highpass";f.frequency.value=hp;env(g,t,.002,v,dur);s.connect(f);f.connect(g);g.connect(dest||run);s.start(t,Math.random()*.5);s.stop(t+dur+.05);}
    function clap(t,v){[0,.012,.024].forEach(function(d){hit(t+d,v*.7,900,.12);});}
    function sub(t,m,v){var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=mtof(m);env(g,t,.01,v,.22);o.connect(g);g.connect(run);o.start(t);o.stop(t+.3);}
    function walk(t){ /* a soft «walk» on the runway, at most every 8 s */
      if(t-lastWalk<8||!window.speechSynthesis)return;lastWalk=t;var delay=Math.max(0,(t-ctx.currentTime)*1000);
      setTimeout(function(){if(stopped)return;try{var u=new SpeechSynthesisUtterance("walk");u.lang="en-GB";u.rate=.75;u.pitch=1.15;
        var vol=window.VV_VOLUME?VV_VOLUME.get()/100:1;u.volume=.55*vol;speechSynthesis.speak(u);}catch(e){}},delay);}

    function tick16(t){var m=morph(t),bpm=150-26*m,s16=60/bpm/4,b=step%16;
      pop.gain.setTargetAtTime(Math.cos(m*Math.PI/2),t,.5);run.gain.setTargetAtTime(Math.sin(m*Math.PI/2),t,.5);
      /* hyperpop: bouncy line, metal on the offbeats, glides at bar ends, sparkles */
      if(m<.95){var line=[0,12,7,12,3,12,7,15],ph=line[(b>>1)%8];
        if(b%2===0)rubber(t,tonic+ph+(bar%4===3?2:0),.12);
        if(b%4===2)metal(t,.06);if(b===14)glideBass(t,tonic-12,tonic-24,s16*2,.16);else if(b===0)glideBass(t,tonic-24,tonic-12,s16*3,.14);
        if(b===0&&bar%2===0)sparkle(t,.05);}
      /* runway: four on the floor, clap on 2 and 4, open hat on the off, crash every 8 bars */
      if(m>.05){if(b%4===0)kick(t,.5);if(b===4||b===12)clap(t,.35);if(b%4===2)hit(t,.12,7000,.09);if(b%2===1)hit(t,.04,9000,.03);
        if(b%4===0)sub(t,tonic-24+(b===8?7:0),.22);
        if(b===0&&bar%8===0)hit(t,.35,300,1.8);
        if(m>.55&&b===0&&bar%4===2)walk(t);}
      return s16;}
    return {
      schedule:function(now){if(stopped)return;if(next<now)next=now+.05;
        while(next<now+.3){var len=tick16(next);next+=len;step++;if(step%16===0){bar++;if(bar%32===0)tonic=KEYS[Math.floor(Math.random()*KEYS.length)];}}},
      stop:function(){stopped=true;try{speechSynthesis.cancel();}catch(e){}try{bus.disconnect();}catch(e){}},
      info:function(){var m=morph(ctx.currentTime);return {section:m<.3?"Хайперпоп":m>.7?"Подіум · walk":"Перехід",key:(NAMES[tonic]||"")+"-мажор · "+Math.round(150-26*m)+" bpm"};}
    };
  }};
})();
