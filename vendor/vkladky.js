/* Inside «Вайбвет Офіс» a page sits in a tab. This lets its links open in new tabs:
   ⌘/Ctrl+click (background), ⌘/Ctrl+Shift+click or middle click, links with target=_blank,
   and a right-click menu. Does nothing until the Office says hello, so normal browsing is untouched. */
(function(){
  if(window.top===window)return;
  var on=false;
  addEventListener("message",function(e){
    if(e.source!==parent||!e.data)return;
    if(e.data.type==="vv-office-hello")on=true;
    if(e.data.type==="vv-feed?")parent.postMessage({type:"vv-feed",tiles:tiles(),news:news()},"*");
  });
  /* the Office's new tab asks for the «Ще» tiles and the newsfeed of the radio page */
  function tiles(){return (window.VV_TILES||[]).map(function(x){return {go:x.go,ic:x.ic,b:x.b,s:x.s||"",priv:x.priv||""};});}
  function news(){
    var out=[];document.querySelectorAll("#breaking article, .news article").forEach(function(a){
      var h=a.querySelector("h3");if(!h)return;var l=h.querySelector("a[href]")||a.querySelector("p a[href]");
      var tag=a.querySelector(".tag"),p=a.querySelector("p");
      out.push({tag:tag?tag.textContent.trim():"",h:h.textContent.trim(),href:l?l.href:"",p:p?p.textContent.trim().slice(0,170):""});
    });return out;
  }
  function link(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return null;var h=a.getAttribute("href")||"";if(/^(javascript:|mailto:|tel:|webcal:)/i.test(h)||a.hasAttribute("download"))return null;return a;}
  function send(a,extra){var m={type:"vv-open",href:a.href,text:(a.textContent||"").trim().slice(0,80)};for(var k in extra)m[k]=extra[k];parent.postMessage(m,"*");}
  document.addEventListener("click",function(e){
    if(!on||e.button!==0)return;var a=link(e);if(!a)return;
    var mod=e.metaKey||e.ctrlKey;
    if(mod||a.target==="_blank"){e.preventDefault();e.stopPropagation();send(a,{bg:mod&&!e.shiftKey});}
  },true);
  document.addEventListener("auxclick",function(e){if(!on||e.button!==1)return;var a=link(e);if(!a)return;e.preventDefault();send(a,{bg:true});},true);
  document.addEventListener("contextmenu",function(e){if(!on)return;var a=link(e);if(!a)return;e.preventDefault();send(a,{menu:true,x:e.clientX,y:e.clientY});},true);
})();
