/* Котоперекази: твоя QR- і штрихкод-система як платіжна мережа для котобаксів.
   Кожен гаманець має код із шести знаків. Отримати: показуєш QR або штрихкод (Code128). Надіслати: скануєш камерою чи вводиш код.
   Переказ іде через той самий публічний MQTT-брокер, що й Рація: vaibvet/koto/v1/<кому>/<id>, retained, доки отримувач не забере.
   P.send(code, amount) — як і раніше, лише котобакси. P.send(code, amount, cardId) докладає картку авторки з колекції:
   друг отримує і суму, і картку. Чужу картку надіслати не можна. Якщо в друга вона вже є, друга копія не з’являється, а котобакси все одно приходять.
   Котобакси — гра без цінності; переказ — лише блок у ланцюжку обох гаманців. Потрібні vendor/kotobank.js, mqtt, jsQR, qrcode-generator, JsBarcode.
   Картки: vendor/avtorky.js (VV_CARDS). Це не гроші й не криптовалюта. */
(function(){
  "use strict";
  if(window.VV_KOTOPAY)return;
  var BROKER="wss://broker.emqx.io:8084/mqtt",TP="vaibvet/koto/v1/",ALPH="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function valid(c){return typeof c==="string"&&new RegExp("^["+ALPH+"]{6}$").test(c);}
  function newCode(){var s="",r=crypto.getRandomValues(new Uint8Array(6));for(var i=0;i<6;i++)s+=ALPH[r[i]%ALPH.length];return s;}
  function me(){var c=null;try{c=localStorage.getItem("koto-wallet");}catch(e){}if(!valid(c)){c=newCode();try{localStorage.setItem("koto-wallet",c);}catch(e){}}return c;}
  function seen(){try{return JSON.parse(localStorage.getItem("koto-seen")||"[]");}catch(e){return [];}}
  function mark(id){var s=seen();s.push(id);if(s.length>500)s=s.slice(-500);try{localStorage.setItem("koto-seen",JSON.stringify(s));}catch(e){}}
  var cl=null,onIn=null;
  function connect(){
    if(cl||!window.mqtt)return cl;
    try{cl=mqtt.connect(BROKER,{clientId:"koto_"+me()+"_"+Math.random().toString(36).slice(2,6),clean:true,keepalive:30,reconnectPeriod:5000,connectTimeout:8000});}catch(e){return null;}
    cl.on("connect",function(){cl.subscribe(TP+me()+"/+");});
    cl.on("error",function(){});
    cl.on("message",function(topic,buf){
      if(!buf||!buf.length||buf.length>200)return;var id=topic.split("/").pop(),m;
      try{m=JSON.parse(buf.toString());}catch(e){return;}
      if(!m||!valid(m.f)||m.f===me()||!Number.isInteger(m.a)||m.a<1||m.a>1000||m.id!==id||seen().indexOf(id)>=0)return;
      mark(id);cl.publish(topic,"",{retain:true,qos:1});   /* picked up: clear it from the broker */
      deliver(m);
    });
    return cl;
  }
  function cardIdOk(card){return typeof card==="string"&&/^[a-z0-9-]{1,32}$/.test(card);}
  function deliver(m){
    var gift=null,dup=false;
    if(cardIdOk(m.c)&&window.VV_CARDS){var g=VV_CARDS.grant(m.c);if(g&&g.ok){gift=g.card;dup=!!g.dup;}}
    var why="📲 Переказ від "+m.f;
    if(gift){var nm=(gift.name&&gift.name.uk)||gift.id;why=(dup?"🎁 Повтор «":"🎁 «")+nm+"» від "+m.f;}
    if(window.VV_KOTO)VV_KOTO.earn(m.a,why);
    m.card=gift;m.dup=!!dup;
    try{window.VV_TAPTIC&&VV_TAPTIC(dup?"warning":"success");}catch(e){}
    onIn&&onIn(m);
  }
  function send(to,a,card){
    a=Math.round(a);if(!valid(to)||to===me()||!(a>=1&&a<=1000))return Promise.resolve({ok:false,why:"bad"});
    var cid="";
    if(card!=null&&card!==""){
      if(!cardIdOk(card)||!window.VV_CARDS||!VV_CARDS.byId(card)||!VV_CARDS.owns(card))return Promise.resolve({ok:false,why:"card"});
      cid=card;
    }
    if(!window.VV_KOTO||VV_KOTO.balance()<a)return Promise.resolve({ok:false,why:"money"});
    var id=Date.now().toString(36)+Math.random().toString(36).slice(2,8),m={f:me(),a:a,id:id,t:Date.now()};if(cid)m.c=cid;
    var nm=cid&&VV_CARDS.byId(cid)&&(VV_CARDS.byId(cid).name||{}).uk||cid;
    return VV_KOTO.spend(a,(cid?"🎁 "+nm+" → ":"📤 Переказ → ")+to).then(function(r){if(!r)return {ok:false,why:"money"};
      var c=connect();function pub(){c.publish(TP+to+"/"+id,JSON.stringify(m),{retain:true,qos:1});}
      if(c&&c.connected)pub();else if(c)c.once("connect",pub);
      return {ok:true,id:id};});
  }
  /* ---- drawing my code ---- */
  function qrSvg(text){if(!window.qrcode)return "";var q=qrcode(0,"M");q.addData(text);q.make();return q.createSvgTag({cellSize:6,margin:2,scalable:true});}
  function barcode(svgEl,text){try{if(window.JsBarcode)JsBarcode(svgEl,text,{format:"CODE128",displayValue:true,font:"monospace",fontSize:16,height:56,margin:6,background:"#ffffff",lineColor:"#111111"});}catch(e){}}
  function parse(s){if(!s)return null;s=String(s).trim().toUpperCase();var m=s.match(/(?:VVKOTO:)?([A-Z2-9]{6})$/);return m&&valid(m[1])?m[1]:null;}
  /* ---- scanning: camera + jsQR (BarcodeDetector where it exists, for barcodes too) ---- */
  function scan(video,canvas,cb){
    var stop=false,stream=null,det=null;
    try{if(window.BarcodeDetector)det=new BarcodeDetector({formats:["qr_code","code_128"]});}catch(e){det=null;}
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:false}).then(function(s){stream=s;video.srcObject=s;video.setAttribute("playsinline","");video.muted=true;return video.play();}).then(function(){
      var g=canvas.getContext("2d",{willReadFrequently:true});
      (function tick(){if(stop)return;
        if(video.readyState>=2){
          if(det){det.detect(video).then(function(r){if(r&&r.length){var c=parse(r[0].rawValue);if(c){end();cb(c);}}}).catch(function(){});}
          else if(window.jsQR){var w=video.videoWidth,h=video.videoHeight,k=Math.min(1,480/w);canvas.width=w*k;canvas.height=h*k;g.drawImage(video,0,0,canvas.width,canvas.height);
            var d=g.getImageData(0,0,canvas.width,canvas.height),r=jsQR(d.data,d.width,d.height,{inversionAttempts:"dontInvert"});if(r){var c=parse(r.data);if(c){end();cb(c);return;}}}
        }
        setTimeout(tick,180);})();
    }).catch(function(e){end();cb(null,e);});
    function end(){stop=true;if(stream)stream.getTracks().forEach(function(t){t.stop();});video.srcObject=null;}
    return end;
  }
  window.VV_KOTOPAY={me:me,connect:connect,send:send,qrSvg:qrSvg,barcode:barcode,parse:parse,scan:scan,valid:valid,onIncoming:function(f){onIn=f;}};
})();
