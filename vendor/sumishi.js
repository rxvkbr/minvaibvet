/* «Суміші» — 88.1 FM: Рахманінов з мозком Баха (і туга Андрійка за данським домом).
   An endless piece written live in the browser: Rachmaninoff's harmony (minor keys, add9 and major-seventh
   colours, the Neapolitan, dominant ninths, low bells) carried by Bach's brain (broken-chord preludes,
   a subject answered in canon a fifth below, circle-of-fifths sequences, voices that move by step).
   Nothing is sampled or quoted: every bar is generated.

   VV_SUMISHI.make(ctx, out) → {schedule(now), stop(), info()}  — call schedule() every ~100 ms. */
(function(){
  "use strict";
  if(window.VV_SUMISHI)return;

  function mtof(m){return 440*Math.pow(2,(m-69)/12);}
  function rnd(a){return a[Math.floor(Math.random()*a.length)];}
  var NAT=[0,2,3,5,7,8,10],HAR=[0,2,3,5,7,8,11];
  /* chords as pitch classes over the tonic; b = bass pitch class; dom = use the raised seventh */
  var CH={
    i:{n:"i",pc:[0,3,7,2],b:0},
    i6:{n:"i⁶",pc:[0,3,7],b:3},
    iv:{n:"iv",pc:[5,8,0,3],b:5},
    iv6:{n:"iv⁶",pc:[5,8,0],b:8},
    V7:{n:"V⁷♭⁹",pc:[7,11,2,5,8],b:7,dom:1},
    V:{n:"V",pc:[7,11,2],b:7,dom:1},
    VI:{n:"VI⁷",pc:[8,0,3,7],b:8},
    III:{n:"III",pc:[3,7,10,2],b:3},
    VII:{n:"VII",pc:[10,2,5],b:10},
    ii7:{n:"iiø⁷",pc:[2,5,8,0],b:2},
    N6:{n:"♭II⁶",pc:[1,5,8],b:5},
    v6:{n:"v⁶",pc:[7,10,2],b:10},
    vii7:{n:"vii°⁷",pc:[11,2,5,8],b:11,dom:1},
    /* major, for «Туга за данським домом»: a Danish folk-hymn in the parallel major */
    I:{n:"I",pc:[0,4,7,11],b:0,maj:1},
    vi:{n:"vi",pc:[9,0,4],b:9,maj:1},
    IV:{n:"IV",pc:[5,9,0,2],b:5,maj:1},
    ivm:{n:"iv",pc:[5,8,0],b:5,maj:1},          /* the borrowed minor iv: the longing before home */
    Vs:{n:"V⁷sus",pc:[7,0,2,5],b:7,maj:1},
    V7M:{n:"V⁷",pc:[7,11,2,5],b:7,maj:1},
    iii:{n:"iii",pc:[4,7,11],b:4,maj:1},
    ii7:{n:"ii⁷",pc:[2,5,9,0],b:2,maj:1}
  };
  /* eight-bar phrases: Rachmaninoff colours, Bach logic (sequences, lament bass, cadences) */
  var PHRASES=[
    ["i","VI","iv","V7","i","VI","N6","V7"],                 /* elegy with a Neapolitan before the cadence */
    ["i","iv","VII","III","VI","ii7","V7","i"],               /* Bach's circle of fifths */
    ["i","v6","iv6","V","VI","iv","vii7","V7"],               /* lament bass, step by step down */
    ["i","III","VI","iv","i6","N6","V7","i"],
    ["VI","iv","i","V7","VI","ii7","V7","i"]
  ];
  var HYMNS=[
    ["I","vi","IV","Vs","I","iii","ivm","I"],
    ["I","iii","vi","IV","I","ii7","V7M","I"],
    ["vi","IV","I","Vs","vi","IV","ivm","I"],
    ["I","IV","vi","V7M","IV","I","ivm","I"]
  ];
  var MAJ=[0,2,4,5,7,9,11];
  var SECTIONS=["Прелюдія","Фуга","Дзвони","Туга за данським домом"],TUGA=3;
  var KEYS=[61,62,59,64,60,65];   /* C#, D, B, E, C, F minor — the tonic in the middle of the keyboard */
  var KEYNAME={59:"сі",60:"до",61:"до-дієз",62:"ре",64:"мі",65:"фа"};

  window.VV_SUMISHI={make:function(ctx,out){
    /* ---- room: a warm hall built from decaying noise ---- */
    var dry=ctx.createGain(),wet=ctx.createGain(),rev=ctx.createConvolver(),bus=ctx.createGain();
    var len=Math.floor(ctx.sampleRate*3.2),ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(var c=0;c<2;c++){var d=ir.getChannelData(c);for(var i=0;i<len;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)*(i<ctx.sampleRate*0.012?i/(ctx.sampleRate*0.012):1);}}
    rev.buffer=ir;dry.gain.value=0.78;wet.gain.value=0.42;bus.gain.value=0.9;
    bus.connect(dry);bus.connect(rev);rev.connect(wet);dry.connect(out);wet.connect(out);
    var nodes=[];

    /* ---- instruments ---- */
    function piano(t,m,vel,dur){
      var f=mtof(m),g=ctx.createGain(),lp=ctx.createBiquadFilter(),o1=ctx.createOscillator(),o2=ctx.createOscillator(),o3=ctx.createOscillator();
      o1.type="triangle";o1.frequency.value=f;o2.type="sine";o2.frequency.value=f*2.003;o3.type="sine";o3.frequency.value=f*0.999;
      var g2=ctx.createGain();g2.gain.value=0.28;var g3=ctx.createGain();g3.gain.value=0.5;
      lp.type="lowpass";var bright=Math.min(9000,f*7+900);lp.frequency.setValueAtTime(bright,t);lp.frequency.exponentialRampToValueAtTime(Math.max(300,f*1.6),t+Math.min(2.5,dur+0.6));
      var decay=Math.min(4.5,Math.max(0.5,dur*1.6))*(m<52?1.5:1);
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vel,t+0.005);
      g.gain.exponentialRampToValueAtTime(vel*0.45,t+0.12);g.gain.exponentialRampToValueAtTime(0.0001,t+decay);
      o1.connect(lp);o2.connect(g2);g2.connect(lp);o3.connect(g3);g3.connect(lp);lp.connect(g);g.connect(bus);
      [o1,o2,o3].forEach(function(o){o.start(t);o.stop(t+decay+0.05);});
    }
    function bell(t,m,vel){
      var f=mtof(m);
      [[1,1,4.5],[2.01,.5,3.2],[2.76,.35,2.4],[5.4,.18,1.4],[8.93,.08,.8]].forEach(function(p){
        var o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f*p[0];
        g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vel*p[1],t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+p[2]);
        o.connect(g);g.connect(bus);o.start(t);o.stop(t+p[2]+0.05);
      });
    }

    /* ---- harmony helpers ---- */
    var tonic=rnd(KEYS),section=TUGA,phrase=rnd(HYMNS),phraseN=0;
    function chordAt(bar){return CH[phrase[bar%8]];}
    function scale(ch){return ch&&ch.maj?MAJ:ch&&ch.dom?HAR:NAT;}
    function inSet(m,set){return set.indexOf(((m-tonic)%12+12)%12)>=0;}
    function snap(m,set){for(var d=0;d<7;d++){if(inSet(m+d,set))return m+d;if(inSet(m-d,set))return m-d;}return m;}
    function nearestPc(target,pc,lo,hi){var best=null;for(var m=lo;m<=hi;m++){if(inSet(m,pc)&&(best===null||Math.abs(m-target)<Math.abs(best-target)))best=m;}return best===null?target:best;}
    function bassOf(ch){var b=tonic-24+ch.b;while(b>tonic-17)b-=12;while(b<tonic-30)b+=12;return b;}

    /* ---- Bach's brain: a subject of eight eighth-notes, stepwise with one leap, then reused in sequence ---- */
    var subject=[];
    function newSubject(){
      var steps=[0],cur=0;
      var shape=rnd([[1,1,-1,-1,2,-1,-1],[-1,-1,1,3,-1,-1,-1],[2,-1,-1,1,1,1,-2],[1,2,-1,-1,-1,2,-1],[-2,1,1,1,-3,1,1]]);
      shape.forEach(function(s){cur+=s;steps.push(cur);});
      subject=steps;   /* scale steps */
    }
    function degreeToMidi(base,deg,sc){var o=Math.floor(deg/7),r=((deg%7)+7)%7;return base+o*12+sc[r];}

    /* ---- the Danish hymn: sixteen half notes you could sing, a half cadence in the middle, home at the end ---- */
    var hymn=[];
    function newHymn(){
      var d=rnd([2,4,4,7]),out=[];
      for(var i=0;i<16;i++){
        if(i===7)d=rnd([1,4]);else if(i===14)d=rnd([1,2]);else if(i===15)d=0;
        else if(i>0){d+=rnd([-1,1,-1,1,-2,2,0,1,-1,3]);if(d<0)d=1;if(d>9)d=8;}
        out.push(d);
      }
      hymn=out;
    }
    /* the sea that keeps breathing under the hymn, and a foghorn from the harbour */
    var sea=null;
    function seaOn(t){
      if(sea)return;
      var n=ctx.createBufferSource(),buf=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),dd=buf.getChannelData(0),last=0;
      for(var i=0;i<dd.length;i++){last=(last+0.02*(Math.random()*2-1))/1.02;dd[i]=last*3.5;}
      n.buffer=buf;n.loop=true;
      var lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=700;
      var g=ctx.createGain(),swell=ctx.createGain(),lfo=ctx.createOscillator();
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(1,t+4);
      swell.gain.value=0.05;lfo.frequency.value=0.09;var depth=ctx.createGain();depth.gain.value=0.04;
      lfo.connect(depth);depth.connect(swell.gain);
      n.connect(lp);lp.connect(swell);swell.connect(g);g.connect(bus);
      n.start(t);lfo.start(t);sea={n:n,g:g,lfo:lfo};
    }
    function seaOff(t){
      if(!sea)return;var s0=sea;sea=null;
      s0.g.gain.setValueAtTime(1,t);s0.g.gain.exponentialRampToValueAtTime(0.0001,t+5);
      try{s0.n.stop(t+5.2);s0.lfo.stop(t+5.2);}catch(e){}
    }
    function foghorn(t,m){
      var lp=ctx.createBiquadFilter(),g=ctx.createGain();lp.type="lowpass";lp.frequency.value=380;
      g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.07,t+1.2);g.gain.setValueAtTime(0.07,t+2.6);g.gain.exponentialRampToValueAtTime(0.0001,t+4.4);
      [1,2.002,3.01].forEach(function(h,i){var o=ctx.createOscillator();o.type=i?"sine":"sawtooth";o.frequency.value=mtof(m)*h;
        var og=ctx.createGain();og.gain.value=[0.5,0.35,0.15][i];o.connect(og);og.connect(lp);o.start(t);o.stop(t+4.5);});
      lp.connect(g);g.connect(bus);
    }
    newHymn();

    /* ---- the conductor: a breathing tempo (rubato), bars of 16 sixteenths ---- */
    var BPM=66,next=ctx.currentTime+0.2,step=0,lastSop=tonic+12,lastAlt=tonic+5;
    newSubject();
    function sixteenth(bar,pos){
      var p=(bar%8+pos/16)/8;               /* where we are in the phrase, 0..1 */
      var breathe=1+0.07*Math.sin(p*Math.PI*2-Math.PI/2)+(bar%8===7&&pos>=8?0.18*(pos-8)/8:0);   /* ritardando into the cadence */
      return 60/BPM/4*breathe*(section===TUGA?1.18:1);
    }
    function nextPhrase(){
      phraseN++;
      var was=section;
      section=(section+1+(Math.random()<0.25?1:0))%SECTIONS.length;
      if(phraseN%3===0){var cand=KEYS.filter(function(k){return k!==tonic&&Math.abs(k-tonic)<=5;});tonic=rnd(cand);}
      if(section===TUGA){phrase=rnd(HYMNS);newHymn();}else{phrase=rnd(PHRASES);if(was===TUGA)seaOff(next);}
      newSubject();
    }

    function playStep(t,s){
      var bar=Math.floor(s/16),pos=s%16,ch=chordAt(bar),sc=scale(ch),sec=SECTIONS[section];
      var dur16=sixteenth(bar,pos);
      if(pos===0&&bar%8===0&&s>0){/* phrase boundary is handled in schedule */}
      var bass=bassOf(ch);
      if(sec==="Прелюдія"){
        /* Bach's broken chords (as in a well-tempered prelude) but voiced in Rachmaninoff's colours */
        var voic=[];for(var m=tonic-5;m<=tonic+19;m++)if(inSet(m,ch.pc))voic.push(m);
        voic=voic.filter(function(x,i){return i%1===0;}).slice(0,7);
        if(pos===0){piano(t,bass,0.2,dur16*16);piano(t,bass+12,0.08,dur16*14);}
        if(pos===2)piano(t,voic[1]||bass+19,0.09,dur16*10);
        if(pos>=4){var pat=[2,3,4,5,4,3,2,3,4,5,6,5];var idx=pat[(pos-4)%pat.length];piano(t,voic[Math.min(idx,voic.length-1)]+(pos>=10?0:0),0.075+(pos%4===0?0.03:0),dur16*3);}
        if(bar%8===7&&pos===0){piano(t,bass-12,0.12,dur16*16);}
      }else if(sec==="Фуга"){
        /* subject in the soprano, answered a fifth below one bar later; bass walks in half notes */
        var base=tonic+12;
        if(pos%2===0){
          var k=pos/2,deg=subject[k]+((bar%8)>=4?-(bar%4):bar%4);   /* sequence: the subject climbs, then falls */
          var sop=degreeToMidi(base,deg,sc);
          if(pos%8===0)sop=nearestPc(sop,ch.pc,sop-3,sop+3);       /* strong beats land on chord tones */
          sop=Math.max(tonic+5,Math.min(tonic+26,sop));
          piano(t,sop,0.1+(pos===0?0.03:0),dur16*2.2);lastSop=sop;
          if(bar%8>=1){
            var adeg=subject[k]+((bar%8-1)>=4?-((bar-1)%4):(bar-1)%4)-4;
            var alt=degreeToMidi(base-12,adeg+7,sc);
            if(pos%8===0)alt=nearestPc(alt,ch.pc,alt-3,alt+3);
            if(alt>=sop-2)alt-=12;
            if(Math.abs(sop-alt)%12===0&&Math.sign(sop-lastSop)===Math.sign(alt-lastAlt))alt=snap(alt-3,sc);  /* no parallel octaves */
            alt=Math.max(tonic-7,Math.min(sop-3,alt));
            piano(t,alt,0.075,dur16*2.2);lastAlt=alt;
          }
        }
        if(pos===0||pos===8){var bb=pos===0?bass:snap(bass+(Math.random()<0.5?2:-1),sc);piano(t,bb,0.16,dur16*8);piano(t,bb+12,0.05,dur16*6);}
      }else if(section===TUGA){
        /* Andriiko's longing for a Danish home: a hymn in the parallel major, Bach's inner voice, the sea */
        if(s%128===0)seaOn(t);
        var hb=tonic+12,b8=bar%8;
        if(pos===0||pos===8){
          var hi=b8*2+(pos/8),hd=hymn[hi];
          var mel2=degreeToMidi(hb,hd,MAJ);
          if(pos===0&&b8!==7)mel2=nearestPc(mel2,ch.pc,mel2-2,mel2+2);
          if(!(b8===7&&pos===8)){piano(t,mel2,0.13,dur16*(b8===7?16:8));piano(t+0.012,mel2-12,0.05,dur16*7);lastSop=mel2;}
          /* bass in half notes, walking by step into the next chord */
          var nb=bassOf(CH[phrase[(b8+1)%8]]),bb2=pos===0?bass:snap(bass+(nb>bass?2:nb<bass?-1:0),MAJ);
          piano(t,bb2,0.15,dur16*8);
          if(pos===0)piano(t,bb2-12,0.07,dur16*12);
        }
        if(pos===0){
          /* the chord, rolled slowly like a hand that does not want to let go */
          var pad=[];for(var m3=tonic-3;m3<=tonic+9;m3++)if(inSet(m3,ch.pc))pad.push(m3);
          pad.forEach(function(n,i){piano(t+0.06+i*0.07,n,0.045,dur16*14);});
          if(b8%4===0)foghorn(t+dur16*2,tonic-24+(b8===4?7:0));
        }
        if(pos%4===2){
          /* Bach's inner voice: quarters a third or a sixth under the hymn, on chord tones where the beat is strong */
          var iv=snap(lastSop-rnd([3,4,8,9]),MAJ);
          if(pos===2||pos===10)iv=nearestPc(iv,ch.pc,iv-2,iv+2);
          iv=Math.max(tonic-2,Math.min(lastSop-3,iv));
          if(!(b8===7&&pos>8))piano(t,iv,0.06,dur16*4);
        }
        if(b8===7&&pos===12)bell(t,tonic+24,0.035);
      }else{
        /* Rachmaninoff's bells: a low octave struck like a bell, chords rolled over three octaves, a melody in octaves */
        if(pos===0){bell(t,bass-12+12,0.12);piano(t,bass,0.22,dur16*16);piano(t,bass-12,0.14,dur16*16);}
        if(pos===0||pos===8){
          var roll=[];for(var m2=tonic-2;m2<=tonic+16;m2++)if(inSet(m2,ch.pc))roll.push(m2);
          roll.forEach(function(n,i){piano(t+i*0.028,n,0.06,dur16*8);});
        }
        if(pos===0||pos===6||pos===12){
          var mel=nearestPc(lastSop+rnd([-2,-1,1,2,0]),pos===0?ch.pc:ch.pc.concat(sc.map(function(x){return x;})),tonic+9,tonic+24);
          if(pos!==0)mel=snap(lastSop+rnd([-2,-1,1,-1]),sc);
          mel=Math.max(tonic+7,Math.min(tonic+24,mel));
          piano(t,mel,0.13,dur16*(pos===12?4:6));piano(t,mel-12,0.07,dur16*(pos===12?4:6));lastSop=mel;
        }
        if(bar%8===7&&pos===12){bell(t,tonic+12,0.07);}
      }
      return dur16;
    }

    var stopped=false;
    return {
      schedule:function(now){
        if(stopped)return;
        if(next<now)next=now+0.05;
        while(next<now+0.3){
          var bar=Math.floor(step/16);
          if(step>0&&step%128===0&&!this._turned){nextPhrase();this._turned=true;}
          if(step%128!==0)this._turned=false;
          next+=playStep(next,step);step++;
        }
      },
      stop:function(){stopped=true;seaOff(ctx.currentTime);try{bus.disconnect();}catch(e){}},
      info:function(){var bar=Math.floor(step/16);return {section:SECTIONS[section],key:(KEYNAME[tonic]||"")+(section===TUGA?"-мажор":"-мінор"),chord:chordAt(bar).n,bar:bar%8+1};}
    };
  }};
})();
