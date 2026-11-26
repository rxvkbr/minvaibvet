/* «Звіринець»: створи свою тваринку, спускаючись справжнім деревом життя.
   Домен → царство → тип → клас → ряд → родина → рід → вид, з латинськими назвами, щоб діти вчилися шукати.
   Бактерії й археї — окремі домени; віруси — поза деревом життя (вони не клітини), але теж мають свою класифікацію.
   «Схрестити» складає фантазійного гібрида з двох видів і чесно пише, що в природі такого немає.
   VV_ZOO.mount(panelEl, svgGroupEl, onPick) — малює панель і тваринку; onPick(leaf) щоразу, коли вибрано вид. */
(function(){
  "use strict";
  if(window.VV_ZOO)return;
  /* node: [латинь, українською, plan (для малювання), children | species] ; species: [латинь, українською, plan, колір] */
  var RANKS=["Домен","Царство","Тип","Клас","Ряд","Родина","Рід","Вид"];
  var VR=["Реалм","Царство","Тип","Клас","Ряд","Родина","Рід","Вид"];
  function sp(l,u,plan,col){return {sp:1,l:l,u:u,plan:plan,col:col};}
  function n(l,u,ch){return {l:l,u:u,ch:ch};}
  var TREE=n("Vita","Життя",[
    n("Eukaryota","Еукаріоти",[
      n("Animalia","Тварини",[
        n("Chordata","Хордові",[
          n("Mammalia","Ссавці",[
            n("Carnivora","Хижі",[
              n("Felidae","Котові",[n("Felis","Кіт",[sp("Felis catus","Кіт свійський","mammal","#f0a93a")])]),
              n("Canidae","Псові",[n("Vulpes","Лисиця",[sp("Vulpes vulpes","Лисиця звичайна","mammal","#e0702a")]),n("Canis","Вовк",[sp("Canis lupus familiaris","Собака свійський","mammal","#c9a37a")])])]),
            n("Rodentia","Гризуни",[
              n("Caviidae","Кавієві",[n("Hydrochoerus","Капібара",[sp("Hydrochoerus hydrochaeris","Капібара","mammal","#a9774e")])]),
              n("Muridae","Мишеві",[n("Rattus","Пацюк",[sp("Rattus norvegicus","Пацюк сірий","mammal","#9a9590")])])]),
            n("Eulipotyphla","Комахоїдні",[n("Erinaceidae","Їжакові",[n("Erinaceus","Їжак",[sp("Erinaceus roumanicus","Їжак білочеревий","hedgehog","#8a6a4a")])])]),
            n("Primates","Примати",[n("Hominidae","Гомініди",[n("Homo","Людина",[sp("Homo sapiens","Людина розумна","human","#e8b98d"),sp("Homo ukrainitas","Андрійко (вид-фантазія з казки)","human","#ffd36e")])])]),
            n("Artiodactyla","Парнокопитні",[n("Bovidae","Бикові",[n("Bos","Бик",[sp("Bos taurus","Корова свійська","mammal","#f2efe8")])])])]),
          n("Aves","Птахи",[
            n("Passeriformes","Горобцеподібні",[
              n("Corvidae","Воронові",[n("Corvus","Крук",[sp("Corvus corax","Крук (ворон)","bird","#2b2b33")])]),
              n("Hirundinidae","Ластівкові",[n("Hirundo","Ластівка",[sp("Hirundo rustica","Ластівка сільська","bird","#2a4a8a")])])]),
            n("Anseriformes","Гусеподібні",[n("Anatidae","Качкові",[n("Anas","Качка",[sp("Anas platyrhynchos","Крижень","bird","#3d8a55")])])])]),
          n("Actinopterygii","Променепері риби",[n("Cypriniformes","Коропоподібні",[n("Cyprinidae","Коропові",[n("Carassius","Карась",[sp("Carassius auratus","Золота рибка","fish","#ff8a2a")])])])]),
          n("Amphibia","Земноводні",[n("Anura","Безхвості",[n("Ranidae","Жаб'ячі",[n("Pelophylax","Жаба",[sp("Pelophylax ridibundus","Жаба озерна","frog","#5aa04a")])])])])]),
        n("Arthropoda","Членистоногі",[
          n("Insecta","Комахи",[
            n("Hymenoptera","Перетинчастокрилі",[n("Apidae","Бджолині",[n("Apis","Бджола",[sp("Apis mellifera","Бджола медоносна","insect","#f2c230")])])]),
            n("Lepidoptera","Лускокрилі",[n("Nymphalidae","Сонцевиці",[n("Aglais","Сонцевик",[sp("Aglais io","Павиче око денне","butterfly","#c0392b")])])]),
            n("Coleoptera","Твердокрилі (жуки)",[n("Coccinellidae","Сонечка",[n("Coccinella","Сонечко",[sp("Coccinella septempunctata","Сонечко семикрапкове","beetle","#e23b2e")])])])])]),
        n("Mollusca","Молюски",[
          n("Cephalopoda","Головоногі",[n("Octopoda","Восьминоги",[n("Octopodidae","Восьминогові",[n("Octopus","Восьминіг",[sp("Octopus vulgaris","Восьминіг звичайний","octopus","#d4577a")])])])]),
          n("Gastropoda","Черевоногі",[n("Stylommatophora","Стебельчастоокі",[n("Helicidae","Завиткові",[n("Helix","Равлик",[sp("Helix pomatia","Равлик виноградний","snail","#c9a46a")])])])])])]),
      n("Plantae","Рослини",[
        n("Tracheophyta","Судинні",[
          n("Magnoliopsida","Дводольні",[
            n("Asterales","Айстроцвіті",[n("Asteraceae","Айстрові",[n("Helianthus","Соняшник",[sp("Helianthus annuus","Соняшник однорічний","flower","#ffc93a")])])]),
            n("Rosales","Розоцвіті",[n("Moraceae","Шовковицеві",[n("Ficus","Фікус",[sp("Ficus carica","Інжир","tree","#5f8a3a")])])]),
            n("Fagales","Букоцвіті",[n("Fagaceae","Букові",[n("Quercus","Дуб",[sp("Quercus robur","Дуб звичайний","tree","#3f7a34")])])])])])]),
      n("Fungi","Гриби",[
        n("Basidiomycota","Базидієві",[
          n("Agaricomycetes","Агарикоміцети",[
            n("Agaricales","Агарикальні",[n("Amanitaceae","Мухоморові",[n("Amanita","Мухомор",[sp("Amanita muscaria","Мухомор червоний","mushroom","#e0352b")])])]),
            n("Boletales","Болетальні",[n("Boletaceae","Болетові",[n("Boletus","Боровик",[sp("Boletus edulis","Білий гриб","mushroom","#8a5a30")])])])])])])]),
    n("Bacteria","Бактерії",[
      n("Pseudomonadota","Псевдомонадоти",[n("Gammaproteobacteria","Гамапротеобактерії",[n("Enterobacterales","Ентеробактеріальні",[n("Enterobacteriaceae","Ентеробактерії",[n("Escherichia","Ешерихія",[sp("Escherichia coli","Кишкова паличка","rod","#5ab0e0")])])])])]),
      n("Bacillota","Баціллоти",[n("Bacilli","Бацили",[n("Lactobacillales","Лактобацилальні",[n("Lactobacillaceae","Лактобацилові",[n("Lactobacillus","Лактобацила",[sp("Lactobacillus delbrueckii","Болгарська паличка (йогурт)","rod","#f0e0b0")])])])])]),
      n("Cyanobacteriota","Ціанобактерії",[n("Cyanophyceae","Ціанофіцеї",[n("Nostocales","Ностокальні",[n("Nostocaceae","Ностокові",[n("Nostoc","Носток",[sp("Nostoc commune","Носток звичайний","chain","#3aa07a")])])])])])]),
    n("Archaea","Археї",[n("Methanobacteriota","Метанобактеріоти",[n("Methanobacteria","Метанобактерії",[n("Methanobacteriales","Метанобактеріальні",[n("Methanobacteriaceae","Метанобактерієві",[n("Methanobrevibacter","Метанобревібактер",[sp("Methanobrevibacter smithii","Метанобревібактер Сміта","coccus","#b08ad0")])])])])])])]);
  /* viruses: not cells and not on the tree of life, but they have their own ranks (ICTV) */
  var VIRUS=n("Virus","Віруси (поза деревом життя)",[
    n("Duplodnaviria","Дуплоднавірія",[n("Heunggongvirae","Хеунггонгвіри",[n("Uroviricota","Уровірикоти",[n("Caudoviricetes","Хвостаті фаги",[n("—","(ряд не визначено)",[n("Straboviridae","Страбовіруси",[n("Tequatrovirus","Тек'ватровірус",[sp("Phage T4","Бактеріофаг T4 (їсть кишкову паличку)","phage","#9ad0ff")])])])])])])]),
    n("Riboviria","Рибовірія",[n("Orthornavirae","Ортоновіри",[n("Kitrinoviricota","Кітриновірикоти",[n("Alsuviricetes","Альсувірицети",[n("Martellivirales","Мартелівірусні",[n("Virgaviridae","Віргавіруси",[n("Tobamovirus","Тобамовірус",[sp("TMV","Вірус тютюнової мозаїки","tmv","#a0d080")])])])])])])])]);
  var ROOTS=[TREE,VIRUS];

  /* every species with its path, for search and crossing */
  var ALL=[];
  function walk(node,path,virus){if(node.sp){ALL.push({leaf:node,path:path,virus:virus});return;}(node.ch||[]).forEach(function(c){walk(c,path.concat([c]),virus);});}
  walk(TREE,[],false);walk(VIRUS,[],true);

  /* ---------------- drawing: one body plan per group, coloured per species ---------------- */
  function shade(hex,k){var n=parseInt(hex.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;function c(x){return Math.max(0,Math.min(255,Math.round(k>1?x+(255-x)*(k-1):x*k)));}return "rgb("+c(r)+","+c(g)+","+c(b)+")";}
  var EYES='<g class="eo"><ellipse cx="{x1}" cy="{y}" rx="5" ry="7" fill="#21150e"/><ellipse cx="{x2}" cy="{y}" rx="5" ry="7" fill="#21150e"/></g><g class="ec" fill="none" stroke="#21150e" stroke-width="3" stroke-linecap="round"><path d="M{a1} {y}q7 7 14 0"/><path d="M{a2} {y}q7 7 14 0"/></g>';
  function eyes(x1,x2,y){return EYES.replace(/\{x1\}/g,x1).replace(/\{x2\}/g,x2).replace(/\{y\}/g,y).replace("{a1}",x1-7).replace("{a2}",x2-7);}
  var PLAN={
    mammal:function(c){var d=shade(c,.75),l=shade(c,1.3);return '<path d="M248 168q44-8 30-56" fill="none" stroke="'+d+'" stroke-width="15" stroke-linecap="round"/><ellipse cx="160" cy="152" rx="96" ry="50" fill="'+c+'"/><polygon points="121,74 126,32 152,58" fill="'+c+'"/><polygon points="199,74 194,32 168,58" fill="'+c+'"/><circle cx="160" cy="96" r="46" fill="'+c+'"/><ellipse cx="160" cy="112" rx="22" ry="14" fill="'+l+'"/>'+eyes(143,177,93)+'<ellipse cx="160" cy="106" rx="6" ry="4" fill="#3a2418"/><ellipse cx="126" cy="190" rx="20" ry="9" fill="'+l+'"/><ellipse cx="194" cy="190" rx="20" ry="9" fill="'+l+'"/>';},
    hedgehog:function(c){var s="";for(var i=0;i<16;i++){var a=Math.PI*(.95+i/15*1.1),x=165+Math.cos(a)*95,y=150+Math.sin(a)*60;s+='<path d="M'+(165+Math.cos(a)*70)+' '+(150+Math.sin(a)*42)+'L'+x+' '+y+'" stroke="'+shade(c,.6)+'" stroke-width="9" stroke-linecap="round"/>';}
      return s+'<ellipse cx="165" cy="155" rx="88" ry="48" fill="'+c+'"/><ellipse cx="88" cy="160" rx="38" ry="28" fill="#e8d2b0"/>'+eyes(78,100,152)+'<circle cx="56" cy="164" r="7" fill="#21150e"/>';},
    bird:function(c){return '<path d="M220 150l60-14-50 34z" fill="'+shade(c,.7)+'"/><ellipse cx="165" cy="150" rx="70" ry="48" fill="'+c+'"/><path d="M150 130q40-40 90 10q-40 0-90 20z" fill="'+shade(c,.8)+'"/><circle cx="120" cy="104" r="34" fill="'+c+'"/><polygon points="88,104 64,112 88,118" fill="#f2b430"/>'+eyes(112,134,98)+'<path d="M150 196v-20M175 196v-20" stroke="#e0a030" stroke-width="5"/>';},
    fish:function(c){return '<path d="M232 150l52-36v72z" fill="'+shade(c,.8)+'"/><ellipse cx="160" cy="150" rx="86" ry="52" fill="'+c+'"/><path d="M150 100q20-26 50 0z" fill="'+shade(c,.8)+'"/><path d="M168 158q16 14 34 2" fill="none" stroke="'+shade(c,.75)+'" stroke-width="5"/>'+eyes(112,132,136)+'<circle cx="160" cy="58" r="6" fill="#bfe8ff" opacity=".7"/><circle cx="174" cy="40" r="4" fill="#bfe8ff" opacity=".6"/>';},
    frog:function(c){return '<ellipse cx="160" cy="160" rx="92" ry="44" fill="'+c+'"/><ellipse cx="160" cy="168" rx="60" ry="26" fill="'+shade(c,1.4)+'"/><circle cx="125" cy="108" r="24" fill="'+c+'"/><circle cx="195" cy="108" r="24" fill="'+c+'"/><circle cx="125" cy="106" r="13" fill="#fff"/><circle cx="195" cy="106" r="13" fill="#fff"/>'+eyes(125,195,106)+'<path d="M120 150q40 22 80 0" fill="none" stroke="#21150e" stroke-width="3"/><ellipse cx="90" cy="196" rx="24" ry="8" fill="'+shade(c,.8)+'"/><ellipse cx="230" cy="196" rx="24" ry="8" fill="'+shade(c,.8)+'"/>';},
    insect:function(c){return '<ellipse cx="128" cy="96" rx="44" ry="26" fill="#dff3ff" opacity=".8" transform="rotate(-25 128 96)"/><ellipse cx="190" cy="96" rx="44" ry="26" fill="#dff3ff" opacity=".8" transform="rotate(25 190 96)"/><ellipse cx="185" cy="145" rx="62" ry="40" fill="'+c+'"/><path d="M160 112v66M188 108v74M214 116v58" stroke="#2a1d10" stroke-width="12"/><circle cx="110" cy="140" r="32" fill="#2a1d10"/>'+eyes(100,120,134).replace(/#21150e/g,"#fff")+'<path d="M96 112q-14-30-30-34M116 110q4-30 20-38" fill="none" stroke="#2a1d10" stroke-width="4"/>';},
    butterfly:function(c){var d=shade(c,.6);return '<ellipse cx="110" cy="105" rx="60" ry="48" fill="'+c+'"/><ellipse cx="210" cy="105" rx="60" ry="48" fill="'+c+'"/><ellipse cx="120" cy="165" rx="40" ry="32" fill="'+d+'"/><ellipse cx="200" cy="165" rx="40" ry="32" fill="'+d+'"/><circle cx="100" cy="100" r="18" fill="#2a4a9a"/><circle cx="220" cy="100" r="18" fill="#2a4a9a"/><circle cx="100" cy="100" r="8" fill="#ffd34a"/><circle cx="220" cy="100" r="8" fill="#ffd34a"/><ellipse cx="160" cy="135" rx="12" ry="56" fill="#2a1d10"/><circle cx="160" cy="80" r="15" fill="#2a1d10"/>'+eyes(153,167,78).replace(/#21150e/g,"#fff")+'<path d="M154 68q-10-30-24-34M166 68q10-30 24-34" fill="none" stroke="#2a1d10" stroke-width="3"/>';},
    beetle:function(c){var s="";[[130,130],[190,130],[120,168],[200,168],[160,112],[150,175],[175,150]].forEach(function(p){s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="10" fill="#1a1010"/>';});return '<ellipse cx="160" cy="148" rx="86" ry="56" fill="'+c+'"/><path d="M160 94v110" stroke="#1a1010" stroke-width="4"/>'+s+'<ellipse cx="160" cy="92" rx="40" ry="24" fill="#1a1010"/>'+eyes(146,174,88).replace(/#21150e/g,"#fff");},
    octopus:function(c){var s="";for(var i=0;i<8;i++){var x=80+i*23;s+='<path d="M'+x+' 140q'+(i%2?18:-18)+' 40 '+(i%2?-6:6)+' 62" fill="none" stroke="'+c+'" stroke-width="16" stroke-linecap="round"/>';}return s+'<ellipse cx="160" cy="105" rx="78" ry="66" fill="'+c+'"/>'+eyes(138,182,112)+'<path d="M148 136q12 10 24 0" fill="none" stroke="#21150e" stroke-width="3"/><circle cx="200" cy="80" r="8" fill="'+shade(c,1.3)+'"/><circle cx="120" cy="70" r="6" fill="'+shade(c,1.3)+'"/>';},
    snail:function(c){return '<path d="M60 190q0-30 40-30h120q30 0 30 30z" fill="#d9c29a"/><circle cx="180" cy="125" r="62" fill="'+c+'"/><path d="M180 125m-12 0a12 12 0 1 1 24 0a24 24 0 1 1-48 0a36 36 0 1 1 72 0a48 48 0 1 1-96 0" fill="none" stroke="'+shade(c,.6)+'" stroke-width="6"/><path d="M88 165l-14-50M104 165l-4-52" stroke="#d9c29a" stroke-width="8" stroke-linecap="round"/>'+eyes(74,100,112);},
    flower:function(c){var s="";for(var i=0;i<14;i++){var a=i/14*Math.PI*2;s+='<ellipse cx="'+(160+Math.cos(a)*46)+'" cy="'+(80+Math.sin(a)*46)+'" rx="22" ry="11" fill="'+c+'" transform="rotate('+(a*180/Math.PI)+' '+(160+Math.cos(a)*46)+' '+(80+Math.sin(a)*46)+')"/>';}
      return '<path d="M160 120v84" stroke="#3f7a34" stroke-width="10"/><ellipse cx="130" cy="170" rx="26" ry="10" fill="#4a9a3a" transform="rotate(-30 130 170)"/><ellipse cx="190" cy="160" rx="26" ry="10" fill="#4a9a3a" transform="rotate(30 190 160)"/>'+s+'<circle cx="160" cy="80" r="34" fill="#5a3a1a"/>'+eyes(148,172,78).replace(/#21150e/g,"#ffd34a");},
    tree:function(c){return '<path d="M150 204v-80h20v80z" fill="#6a4a2a"/><circle cx="160" cy="90" r="62" fill="'+c+'"/><circle cx="110" cy="110" r="40" fill="'+shade(c,1.15)+'"/><circle cx="210" cy="110" r="40" fill="'+shade(c,.9)+'"/>'+eyes(146,174,96)+'<circle cx="120" cy="80" r="8" fill="#7a3a8a"/><circle cx="200" cy="70" r="8" fill="#7a3a8a"/><circle cx="180" cy="128" r="8" fill="#7a3a8a"/>';},
    mushroom:function(c){return '<path d="M130 204q-6-60 10-96h40q16 36 10 96z" fill="#f2ead8"/><path d="M60 118q100-110 200 0z" fill="'+c+'"/><circle cx="110" cy="92" r="10" fill="#fff"/><circle cx="160" cy="70" r="12" fill="#fff"/><circle cx="208" cy="92" r="9" fill="#fff"/>'+eyes(146,174,150);},
    rod:function(c){return '<path d="M60 150q-30 10-40 40M260 150q30-10 40-40M110 182q-6 20 -26 24M210 118q6-20 26-24" fill="none" stroke="'+shade(c,.7)+'" stroke-width="4"/><rect x="60" y="110" width="200" height="80" rx="40" fill="'+c+'"/><rect x="80" y="124" width="160" height="52" rx="26" fill="'+shade(c,1.25)+'" opacity=".6"/>'+eyes(140,180,146);},
    chain:function(c){var s="";for(var i=0;i<6;i++)s+='<circle cx="'+(70+i*36)+'" cy="'+(150+Math.sin(i)*14)+'" r="22" fill="'+c+'" stroke="'+shade(c,.7)+'" stroke-width="3"/>';return s+eyes(141,170,140);},
    coccus:function(c){return '<circle cx="160" cy="140" r="64" fill="'+c+'"/><circle cx="160" cy="140" r="50" fill="'+shade(c,1.2)+'" opacity=".5"/><path d="M96 140q-30-20-50 0M224 140q30 20 50 0" fill="none" stroke="'+shade(c,.7)+'" stroke-width="4"/>'+eyes(144,176,134);},
    phage:function(c){return '<polygon points="160,30 205,56 205,108 160,134 115,108 115,56" fill="'+c+'" stroke="'+shade(c,.6)+'" stroke-width="4"/><rect x="152" y="134" width="16" height="44" fill="'+shade(c,.7)+'"/><path d="M160 178l-50 26M160 178l-24 30M160 178l24 30M160 178l50 26" stroke="'+shade(c,.6)+'" stroke-width="5" stroke-linecap="round"/>'+eyes(146,174,80);},
    human:function(c){return '<rect x="128" y="120" width="64" height="70" rx="22" fill="#2f6fd0"/><rect x="128" y="150" width="64" height="40" rx="10" fill="#ffd34a" opacity=".9"/><circle cx="160" cy="88" r="40" fill="'+c+'"/><path d="M122 78q38-44 76 0q-8-20-38-24q-30 4-38 24z" fill="#3a2414"/>'+eyes(146,174,90)+'<path d="M146 108q14 12 28 0" fill="none" stroke="#21150e" stroke-width="3" stroke-linecap="round"/><path d="M140 190v14M180 190v14" stroke="#14324a" stroke-width="12" stroke-linecap="round"/><rect x="200" y="150" width="22" height="26" rx="4" fill="#ff8a3d"/><path d="M211 150v-10" stroke="#8a5a30" stroke-width="3"/>';},
    tmv:function(c){var s="";for(var i=0;i<12;i++)s+='<path d="M'+(56+i*18)+' 120v56" stroke="'+shade(c,.75)+'" stroke-width="3"/>';return '<rect x="50" y="118" width="220" height="60" rx="10" fill="'+c+'"/>'+s+eyes(146,174,146);}
  };
  var GROUP={human:null,mammal:"cat",hedgehog:"rat",bird:null,fish:null,frog:null,insect:"rat",butterfly:null,beetle:"rat",octopus:"cat",snail:null,flower:null,tree:null,mushroom:null,rod:"rat",chain:null,coccus:"rat",phage:"rat",tmv:null};
  function art(leaf){var f=PLAN[leaf.plan]||PLAN.mammal;return f(leaf.col);}
  function hybridArt(a,b){   /* body of a, the "wings" or crown of b */
    var extra=b.plan==="bird"||b.plan==="butterfly"||b.plan==="insect"?'<ellipse cx="100" cy="90" rx="46" ry="22" fill="'+b.col+'" opacity=".85" transform="rotate(-25 100 90)"/><ellipse cx="220" cy="90" rx="46" ry="22" fill="'+b.col+'" opacity=".85" transform="rotate(25 220 90)"/>':
      b.plan==="mushroom"?'<path d="M110 52q50-50 100 0z" fill="'+b.col+'"/><circle cx="160" cy="34" r="6" fill="#fff"/>':
      b.plan==="flower"||b.plan==="tree"?'<circle cx="160" cy="40" r="16" fill="'+b.col+'"/><circle cx="140" cy="46" r="12" fill="'+b.col+'"/><circle cx="180" cy="46" r="12" fill="'+b.col+'"/>':
      '<path d="M120 40q40-30 80 0" fill="none" stroke="'+b.col+'" stroke-width="10" stroke-linecap="round"/><circle cx="120" cy="40" r="10" fill="'+b.col+'"/><circle cx="200" cy="40" r="10" fill="'+b.col+'"/>';
    return extra+art(a);
  }
  function hybridName(a,b){var g1=a.l.split(" ")[0],e2=(b.l.split(" ")[1]||b.l.split(" ")[0]).toLowerCase();return g1.slice(0,Math.max(3,Math.ceil(g1.length*.6)))+(b.l.split(" ")[0].slice(-4)).toLowerCase()+" "+e2;}

  /* ---------------- UI ---------------- */
  function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
  window.VV_ZOO={all:ALL,art:art,group:function(l){return l?GROUP[l.plan]:null;},
    mount:function(panel,g,onPick){
      var path=[],cur=null,prev=null,hyb=null;
      try{var sv=JSON.parse(localStorage.getItem("zoo-found")||"[]");}catch(e){sv=[];}
      function found(l){if(sv.indexOf(l)<0){sv.push(l);try{localStorage.setItem("zoo-found",JSON.stringify(sv));}catch(e){}if(window.VV_KOTO)VV_KOTO.earn(3,"🧬 Новий вид: "+l,true);return true;}return false;}
      function draw(){g.innerHTML=hyb?hybridArt(hyb[0],hyb[1]):cur?art(cur):'<text x="160" y="130" text-anchor="middle" font-size="64">🧬</text>';}
      function node(){var r=path.length?path[path.length-1]:null;return r;}
      function isVirus(){return path.length&&path[0]===VIRUS;}
      function pick(leafInfo){cur=leafInfo.leaf;path=[leafInfo.virus?VIRUS:TREE].concat(leafInfo.path);hyb=null;var nw=found(cur.l);draw();render(nw);onPick&&onPick(cur);}
      function render(isNew){
        panel.innerHTML="";
        var crumbs=el("div","zc");var R=isVirus()?VR:RANKS;
        path.slice(1).forEach(function(p,i){var b=el("button","zb");b.innerHTML='<small>'+R[i]+'</small><i>'+p.l+'</i> '+p.u;b.onclick=function(){path=path.slice(0,i+2);cur=null;hyb=null;draw();render();};crumbs.appendChild(b);});
        panel.appendChild(crumbs);
        if(hyb){var h=el("div","zr");h.innerHTML='<b>🧪 <i></i></b><p></p>';h.querySelector("i").textContent=hybridName(hyb[0],hyb[1]);h.querySelector("p").textContent=hyb[0].u+" × "+hyb[1].u+". Фантазія: у природі такого гібрида немає, бо "+hyb[0].u.toLowerCase()+" і "+hyb[1].u.toLowerCase()+" надто далекі родичі.";panel.appendChild(h);}
        else if(cur){var r=el("div","zr");r.innerHTML='<b><i></i></b><p></p>';r.querySelector("i").textContent=cur.l;r.querySelector("p").textContent=cur.u+(cur.l==="Homo ukrainitas"?" · Казка з газети. Науково всі ми Homo sapiens 🙂":"")+(isNew?" · 🎉 новий вид у твоєму звіринці! +3 🐾":"")+(isVirus()?" · Віруси не клітини, тому не входять у дерево життя.":"");panel.appendChild(r);}
        else{
          var q=el("p","zq");var R2=isVirus()?VR:RANKS,lvl=path.length?path.length-1:0;
          q.textContent=path.length?("Обери: "+(R2[lvl]||"").toLowerCase()):"Звідки почнемо? Обери домен або віруси.";panel.appendChild(q);
          var opts=el("div","zo"),list=path.length?node().ch:[TREE.ch[0],TREE.ch[1],TREE.ch[2],VIRUS];
          list.forEach(function(c){var b=el("button");b.innerHTML='<i>'+c.l+'</i><span></span>';b.querySelector("span").textContent=c.u;
            b.onclick=function(){window.VV_TAPTIC&&VV_TAPTIC("tick");
              if(!path.length)path=[c===VIRUS?VIRUS:TREE];
              if(c!==VIRUS)path.push(c);
              if(c.sp){var inf=ALL.filter(function(a){return a.leaf===c;})[0];pick(inf);return;}
              render();};opts.appendChild(b);});
          panel.appendChild(opts);}
        var tools=el("div","zt");
        function tb(t,f){var b=el("button");b.textContent=t;b.onclick=f;tools.appendChild(b);}
        tb("🎲 Випадковий вид",function(){var a=ALL[Math.floor(Math.random()*ALL.length)];prev=cur;pick(a);window.VV_TAPTIC&&VV_TAPTIC("light");});
        if(cur||hyb)tb("🧪 Схрестити",function(){var a=cur||hyb[0],b;do{b=ALL[Math.floor(Math.random()*ALL.length)].leaf;}while(b===a);hyb=[a,b];draw();render();window.VV_TAPTIC&&VV_TAPTIC("success");});
        tb("↺ Спочатку",function(){path=[];cur=null;hyb=null;draw();render();});
        panel.appendChild(tools);
        var s=el("div","zs");s.innerHTML='<input placeholder="🔎 Знайди: кіт, Felis, гриб, паличка…" autocomplete="off"><div class="zh"></div>';
        var inp=s.querySelector("input"),out=s.querySelector(".zh");
        inp.oninput=function(){var v=inp.value.trim().toLowerCase();out.innerHTML="";if(v.length<2)return;
          ALL.filter(function(a){return (a.leaf.l+" "+a.leaf.u+" "+a.path.map(function(p){return p.l+" "+p.u;}).join(" ")).toLowerCase().indexOf(v)>=0;}).slice(0,6).forEach(function(a){
            var b=el("button");b.innerHTML='<b></b><small></small>';b.querySelector("b").textContent=a.leaf.u+" · "+a.leaf.l;b.querySelector("small").textContent=a.path.slice(0,-1).map(function(p){return p.u;}).join(" › ");
            b.onclick=function(){inp.value="";out.innerHTML="";pick(a);};out.appendChild(b);});};
        panel.appendChild(s);
        var f=el("p","zf");f.textContent="Знайдено видів: "+sv.length+" з "+ALL.length;panel.appendChild(f);
      }
      draw();render();
    }};
  var css=".zoo{margin-top:12px;font:14px/1.4 system-ui,sans-serif}.zc{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}.zb{border:1px solid #ffffff22;background:#ffffff0c;color:inherit;border-radius:10px;padding:3px 8px;font-size:12px;cursor:pointer;text-align:left}.zb small{display:block;opacity:.6;font-size:10px}"+
    ".zo{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}.zo button,.zt button,.zh button{border:1px solid #ffffff22;background:#ffffff10;color:inherit;border-radius:12px;padding:9px 10px;cursor:pointer;text-align:left;font:inherit}"+
    ".zo i{display:block;font-size:12px;opacity:.7}.zq{margin:4px 0 8px;opacity:.85}.zt{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.zr b{font-size:18px}.zr p{margin:4px 0 0;opacity:.85}"+
    ".zs input{width:100%;box-sizing:border-box;margin-top:10px;background:#0006;border:1px solid #ffffff22;color:inherit;border-radius:12px;padding:9px 10px;font:inherit}.zh button{display:block;width:100%;margin-top:4px}.zh small{display:block;opacity:.6;font-size:11px}.zf{opacity:.6;font-size:12px;margin:8px 0 0}";
  var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
})();
