/* Hand tracking for «Безкінечний диригент» and «Маестро» (MediaPipe Hand Landmarker, loaded from the CDN).
   Safari and the iPhone/iPad app run it on the CPU: the GPU path in WebKit often loads and then sees nothing.
   Elsewhere it starts on the GPU and drops to the CPU if the GPU throws or never finds a hand. */
window.VV_HAND=async function(video,numHands,onHands,say){
  var MP="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  var MODEL="https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
  var ua=navigator.userAgent,C=window.Capacitor;
  var webkit=(/AppleWebKit/.test(ua)&&!/Chrome|CriOS|Chromium|Edg|Android/.test(ua))||(C&&C.getPlatform&&C.getPlatform()==="ios");
  var v=await import(MP+"/vision_bundle.mjs"),fs=await v.FilesetResolver.forVisionTasks(MP+"/wasm");
  async function make(dlg){return v.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MODEL,delegate:dlg},runningMode:"VIDEO",numHands:numHands,minHandDetectionConfidence:.4,minTrackingConfidence:.4});}
  var dlg=webkit?"CPU":"GPU",lm;
  try{lm=await make(dlg);}catch(e){dlg="CPU";lm=await make(dlg);}
  var frames=0,seen=0,lastTs=0,busy=false;
  function loop(){
    requestAnimationFrame(loop);
    var now=performance.now();if(busy||video.readyState<2||now-lastTs<(dlg==="CPU"?45:30))return;
    lastTs=now;var r;
    try{r=lm.detectForVideo(video,now);}catch(e){if(dlg==="GPU")fallback();return;}
    frames++;var hs=(r&&r.landmarks)||[];if(hs.length)seen++;
    onHands(hs);
    /* GPU ran for ~5 seconds and never saw a hand: try the CPU once */
    if(dlg==="GPU"&&frames>150&&!seen)fallback();
  }
  async function fallback(){if(busy)return;busy=true;dlg="CPU";try{lm.close();}catch(e){}try{lm=await make("CPU");if(say)say("Перемкнув розпізнавання на процесор. Підніми руку 🖐");}catch(e){}frames=0;busy=false;}
  loop();
  return dlg;
};
