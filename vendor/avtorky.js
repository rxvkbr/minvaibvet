/* Картки авторок для Бібліотеки. Колоду готує редакція (лише публічні факти, своїми словами, без фото й портретів).
   Схема картки:
   {id:"kalytenko",                        // латиниця, цифри, дефіс; до 32 символів
    name:{uk:"…",en:"…"}, years:"1990–", place:{uk:"…",en:"…"},
    language:{uk:"…",en:"…"},              // мова творчості, не мова інтерфейсу
    work:{uk:"«…»",en:"…",year:"2023"},
    text:{uk:"2–4 речення",en:"2–4 sentences"},
    emoji:"🖋", src:"https://…"}
   Колекція живе на цьому пристрої: localStorage "avtorky-own" (id → 1).
   VV_CARDS.owns / owned / grant — цим користуються Бібліотека і Котоперекази. */
window.VV_AVTORKY=(window.VV_AVTORKY||[]).concat([
  {id:"kalytenko",
   name:{uk:"Тетяна (Таня) Калитенко",en:"Tetiana (Tania) Kalytenko"},
   years:"1992–",
   place:{uk:"Київ, Україна",en:"Kyiv, Ukraine"},
   language:{uk:"українська",en:"Ukrainian"},
   work:{uk:"«Антеро», роман",en:"Antero, a novel",year:"2020"},
   text:{
     uk:"Українська письменниця, літературознавиця, критикиня й редакторка. Дебютний роман «Антеро» — про пам’ять, родинне минуле і Фінляндію. Згодом вийшла драма-фарс «Агонія»; пише також коротку прозу й критику. У 2023 році захистила в НаУКМА дисертацію з теорії літератури і стала докторкою філософії з філології.",
     en:"A Ukrainian writer, literary scholar, critic, and editor. Her debut novel Antero follows memory, family history, and Finland. She later published the farcical drama Ahoniia (Agony) and also writes short prose and criticism. In 2023 she defended her dissertation at the National University of Kyiv-Mohyla Academy and received a PhD in philology."
   },
   emoji:"❧",
   src:"https://tempora.com.ua/shop/antero"}
]);
(function(){
  "use strict";
  if(window.VV_CARDS)return;
  var KEY="avtorky-own";
  function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||"{}");return o&&typeof o==="object"&&!Array.isArray(o)?o:{};}catch(e){return {};}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
  function all(){return window.VV_AVTORKY||[];}
  function byId(id){var D=all();for(var i=0;i<D.length;i++)if(D[i]&&D[i].id===id)return D[i];return null;}
  window.VV_CARDS={
    all:all,byId:byId,
    owns:function(id){return !!load()[id];},
    owned:function(){var o=load();return all().filter(function(c){return c&&o[c.id];});},
    /* Додає картку з колоди в колекцію цього пристрою. Повтор не створює другу копію. */
    grant:function(id){
      var c=byId(id);if(!c)return {ok:false,why:"unknown"};
      var o=load();if(o[id])return {ok:true,dup:true,card:c};
      o[id]=1;save(o);return {ok:true,dup:false,card:c};
    }
  };
})();
