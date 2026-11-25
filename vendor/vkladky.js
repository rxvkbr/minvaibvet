/* Inside «Вайбвет Офіс» a page sits in a tab. This lets its links open in new tabs:
   ⌘/Ctrl+click (background), ⌘/Ctrl+Shift+click or middle click, links with target=_blank,
   and a right-click menu. Does nothing until the Office says hello, so normal browsing is untouched. */
(function(){
  if(window.top===window)return;
  var on=false;
  addEventListener("message",function(e){if(e.data&&e.data.type==="vv-office-hello")on=true;});
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
