#!/usr/bin/env python3
"""Texts of the widget games («Хрестики-нулики з комбатом», «Вище чи нижче?») in one place.
Writes app/android/.../res/values*/game_strings.xml and app/ios/App/VaibvetWidgets/GameStrings.swift.
   python3 tools/widget-games.py"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = {
 "uk": {
  "g_tt_name": "Хрестики-нулики з комбатом", "g_tt_desc": "Партія на хвилину: ти хрестики, комбат нулики",
  "g_tt_title": "ХРЕСТИКИ-НУЛИКИ · КОМБАТ", "g_tt_score": "Ти %1$d · Комбат %2$d · Нічиї %3$d", "g_new": "Нова гра",
  "g_tt_start": ["Твій хід. Комбат чекає, як на побудові.", "Ходи першим. Комбат сьогодні великодушний."],
  "g_tt_move": ["Комбат поставив нулик і пішов по каву.", "Комбат: «Так і було задумано».", "Комбат думав 0,3 секунди. Як над рапортом.", "Комбат блокує. Як відпустку."],
  "g_tt_win": ["Ти переміг! Комбат від несподіванки підписав рапорт.", "Три в ряд! Комбат каже, що це були навчання."],
  "g_tt_lose": ["Комбат виграв. Каже, що це для твого ж блага.", "Нулики перемогли. Рапорт повернуто на доопрацювання."],
  "g_tt_draw": ["Нічия. Обидва йдуть на перекур.", "Нічия. Ротація знову відкладається."],
  "g_hl_name": "Вище чи нижче?", "g_hl_desc": "Вгадай, чи наступний шанс на відпустку буде вищим. Сім поспіль — і відпустка твоя!",
  "g_hl_title": "ВИЩЕ ЧИ НИЖЧЕ? · ВІДПУСТКА", "g_hl_up": "▲ Вище", "g_hl_down": "▼ Нижче", "g_hl_streak": "Серія %1$d/7 · рекорд %2$d",
  "g_hl_start": "Такий зараз шанс на відпустку. Наступний буде вищим чи нижчим?",
  "g_hl_right": ["Вгадав! Синоптики нервують.", "Так! Ти бачиш ротацію наперед.", "Точно. Комбат питає, звідки ти знаєш."],
  "g_hl_wrong": ["Ні. Прогноз змінився без попередження, як завжди.", "Мимо. Серію повернуто на доопрацювання."],
  "g_hl_win": "Сім поспіль! Відпустку затверджено 🏖 Тисни, щоб грати ще.",
  "g_th_name": "Тор грає", "g_th_desc": "Тор гатить молотом по всьому підряд. А потім…", "g_th_title": "ТОР · МОЛОТ", "g_th_hit": "⚡ Вдарити", "g_th_count": "Ударів %1$d/12", "g_th_lines": ["Тор вдарив по хмарі. Пішов дощ.", "Тор вдарив по рапорту. Рапорт підписався сам.", "Тор полагодив генератор. Одним ударом.", "Тор вдарив по черзі в ЦНАП. Черга розступилася.", "Тор забив цвях у перегаворці. Тепер там висить картина.", "Тор вдарив по будильнику о 05:45. Будильник більше не дзвонить.", "Тор відкрив банку з варенням. З другого удару.", "Тор вдарив по барабану. Резиденти перегаворки танцюють.", "Тор розколов горіх. Білка в шоці.", "Тор вдарив по ковадлу. Сусіди не в шоці, вони звикли.", "Тор розбив лід. У розмові з тещею.", "Тор замахнувся ще раз…"], "g_th_final": "Hammer time.", "g_th_look": "(Тор зупинився й дивиться просто в камеру)", "g_th_again": "Тисни, щоб Тор грав далі"},
 "en": {
  "g_tt_name": "Tic-tac-toe with the Commander", "g_tt_desc": "A one-minute game: you're X, the battalion commander is O",
  "g_tt_title": "TIC-TAC-TOE · COMMANDER", "g_tt_score": "You %1$d · Commander %2$d · Draws %3$d", "g_new": "New game",
  "g_tt_start": ["Your move. The commander waits, like at formation.", "You go first. The commander is generous today."],
  "g_tt_move": ["The commander placed an O and went for coffee.", "Commander: “That was the plan.”", "The commander thought for 0.3 seconds. Like over a leave request.", "The commander blocks. Like your leave."],
  "g_tt_win": ["You won! Surprised, the commander signed your leave request.", "Three in a row! The commander says it was a drill."],
  "g_tt_lose": ["The commander won. Says it's for your own good.", "The O's win. Request returned for revision."],
  "g_tt_draw": ["A draw. Both go for a smoke break.", "A draw. The rotation is postponed again."],
  "g_hl_name": "Higher or lower?", "g_hl_desc": "Guess whether the next chance of leave will be higher. Seven in a row and the leave is yours!",
  "g_hl_title": "HIGHER OR LOWER? · LEAVE", "g_hl_up": "▲ Higher", "g_hl_down": "▼ Lower", "g_hl_streak": "Streak %1$d/7 · best %2$d",
  "g_hl_start": "That's the chance of leave right now. Will the next one be higher or lower?",
  "g_hl_right": ["Right! The forecasters are nervous.", "Yes! You can see the rotation coming.", "Exactly. The commander asks how you knew."],
  "g_hl_wrong": ["No. The forecast changed without warning, as always.", "Missed. The streak was returned for revision."],
  "g_hl_win": "Seven in a row! Leave approved 🏖 Tap to play again.",
  "g_th_name": "Thor plays", "g_th_desc": "Thor hits everything in sight with his hammer. And then…", "g_th_title": "THOR · HAMMER", "g_th_hit": "⚡ Strike", "g_th_count": "Strikes %1$d/12", "g_th_lines": ["Thor hit a cloud. It started raining.", "Thor hit a leave request. It signed itself.", "Thor fixed the generator. One blow.", "Thor hit the queue at the public office. The queue parted.", "Thor hammered a nail into the meeting room wall. Now there's a painting.", "Thor hit the 05:45 alarm. It doesn't ring any more.", "Thor opened the jam jar. On the second blow.", "Thor hit a drum. The meeting room residents are dancing.", "Thor cracked a nut. The squirrel is shocked.", "Thor hit the anvil. The neighbours aren't shocked, they're used to it.", "Thor broke the ice. In a talk with his mother-in-law.", "Thor swings once more…"], "g_th_final": "Hammer time.", "g_th_look": "(Thor stops and looks straight into the camera)", "g_th_again": "Tap to let Thor play on"},
 "nl": {
  "g_tt_name": "Boter-kaas-en-eieren met de commandant", "g_tt_desc": "Een potje van een minuut: jij bent X, de commandant O",
  "g_tt_title": "BOTER-KAAS-EN-EIEREN · COMMANDANT", "g_tt_score": "Jij %1$d · Commandant %2$d · Gelijk %3$d", "g_new": "Nieuw spel",
  "g_tt_start": ["Jouw beurt. De commandant wacht, als bij het appèl.", "Jij begint. De commandant is vandaag gul."],
  "g_tt_move": ["De commandant zette een O en ging koffie halen.", "Commandant: „Zo was het bedoeld.”", "De commandant dacht 0,3 seconde na. Net als over een verlofaanvraag.", "De commandant blokkeert. Net als je verlof."],
  "g_tt_win": ["Gewonnen! Verrast tekende de commandant je verlofaanvraag.", "Drie op een rij! De commandant zegt dat het een oefening was."],
  "g_tt_lose": ["De commandant won. Hij zegt dat het voor je eigen bestwil is.", "De O's winnen. Aanvraag teruggestuurd."],
  "g_tt_draw": ["Gelijkspel. Allebei een rookpauze.", "Gelijkspel. De rotatie wordt weer uitgesteld."],
  "g_hl_name": "Hoger of lager?", "g_hl_desc": "Raad of de volgende kans op verlof hoger is. Zeven op rij en het verlof is van jou!",
  "g_hl_title": "HOGER OF LAGER? · VERLOF", "g_hl_up": "▲ Hoger", "g_hl_down": "▼ Lager", "g_hl_streak": "Reeks %1$d/7 · record %2$d",
  "g_hl_start": "Zo groot is de kans op verlof nu. Wordt de volgende hoger of lager?",
  "g_hl_right": ["Goed! De weermannen worden zenuwachtig.", "Ja! Jij ziet de rotatie aankomen.", "Precies. De commandant vraagt hoe je het wist."],
  "g_hl_wrong": ["Nee. De voorspelling veranderde zonder waarschuwing, zoals altijd.", "Mis. De reeks is teruggestuurd."],
  "g_hl_win": "Zeven op rij! Verlof goedgekeurd 🏖 Tik om nog eens te spelen.",
  "g_th_name": "Thor speelt", "g_th_desc": "Thor slaat met zijn hamer op alles wat hij ziet. En dan…", "g_th_title": "THOR · HAMER", "g_th_hit": "⚡ Slaan", "g_th_count": "Slagen %1$d/12", "g_th_lines": ["Thor sloeg op een wolk. Het begon te regenen.", "Thor sloeg op een verlofaanvraag. Die tekende zichzelf.", "Thor repareerde de generator. Met één klap.", "Thor sloeg op de rij bij het loket. De rij week uiteen.", "Thor sloeg een spijker in de vergaderkamer. Nu hangt er een schilderij.", "Thor sloeg op de wekker van 05:45. Die gaat niet meer af.", "Thor opende de jampot. Bij de tweede klap.", "Thor sloeg op een trommel. De vergaderkamer danst.", "Thor kraakte een noot. De eekhoorn is geschokt.", "Thor sloeg op het aambeeld. De buren schrikken niet meer, ze zijn het gewend.", "Thor brak het ijs. In een gesprek met zijn schoonmoeder.", "Thor haalt nog één keer uit…"], "g_th_final": "Hammer time.", "g_th_look": "(Thor stopt en kijkt recht in de camera)", "g_th_again": "Tik zodat Thor verder speelt"},
 "ar": {
  "g_tt_name": "إكس أو مع القائد", "g_tt_desc": "جولة لدقيقة: أنت X والقائد O",
  "g_tt_title": "إكس أو · القائد", "g_tt_score": "أنت %1$d · القائد %2$d · تعادل %3$d", "g_new": "لعبة جديدة",
  "g_tt_start": ["دورك. القائد ينتظر كما في الطابور.", "ابدأ أنت. القائد كريم اليوم."],
  "g_tt_move": ["وضع القائد O وذهب ليشرب القهوة.", "القائد: «هكذا كان المخطط».", "فكّر القائد 0.3 ثانية. كما يفكر في طلب إجازة.", "القائد يسدّ الطريق. كما يسدّ إجازتك."],
  "g_tt_win": ["فزت! من المفاجأة وقّع القائد طلب إجازتك.", "ثلاثة في صف! القائد يقول إنه كان تدريباً."],
  "g_tt_lose": ["فاز القائد. يقول إن ذلك لمصلحتك.", "فازت الـO. أُعيد الطلب للمراجعة."],
  "g_tt_draw": ["تعادل. كلاكما يذهب لاستراحة.", "تعادل. تأجّل التناوب مرة أخرى."],
  "g_hl_name": "أعلى أم أدنى؟", "g_hl_desc": "خمّن هل ستكون فرصة الإجازة التالية أعلى. سبع مرات متتالية والإجازة لك!",
  "g_hl_title": "أعلى أم أدنى؟ · الإجازة", "g_hl_up": "▲ أعلى", "g_hl_down": "▼ أدنى", "g_hl_streak": "سلسلة %1$d/7 · الأفضل %2$d",
  "g_hl_start": "هذه فرصة الإجازة الآن. هل ستكون التالية أعلى أم أدنى؟",
  "g_hl_right": ["صحيح! خبراء الطقس متوترون.", "نعم! أنت ترى التناوب قبل وصوله.", "بالضبط. القائد يسأل كيف عرفت."],
  "g_hl_wrong": ["لا. تغيّرت التوقعات بلا إنذار كالعادة.", "خطأ. أُعيدت السلسلة للمراجعة."],
  "g_hl_win": "سبع مرات متتالية! تمت الموافقة على الإجازة 🏖 المس لتلعب مجدداً.",
  "g_th_name": "ثور يلعب", "g_th_desc": "ثور يضرب بمطرقته كل ما يراه. ثم…", "g_th_title": "ثور · المطرقة", "g_th_hit": "⚡ اضرب", "g_th_count": "ضربات %1$d/12", "g_th_lines": ["ضرب ثور غيمة. بدأ المطر.", "ضرب ثور طلب إجازة. فوقّع نفسه.", "أصلح ثور المولّد. بضربة واحدة.", "ضرب ثور الطابور في الدائرة الحكومية. فانشق الطابور.", "دقّ ثور مسماراً في غرفة الاجتماعات. الآن عُلّقت لوحة.", "ضرب ثور منبّه الخامسة وخمس وأربعين. لم يعد يرنّ.", "فتح ثور مرطبان المربى. من الضربة الثانية.", "ضرب ثور الطبل. سكان غرفة الاجتماعات يرقصون.", "كسر ثور جوزة. السنجاب مصدوم.", "ضرب ثور السندان. الجيران لم يعودوا يتفاجأون.", "كسر ثور الجليد. في حديث مع حماته.", "رفع ثور المطرقة مرة أخرى…"], "g_th_final": "Hammer time.", "g_th_look": "(توقف ثور وينظر مباشرة إلى الكاميرا)", "g_th_again": "المس ليواصل ثور اللعب"},
 "zh": {
  "g_tt_name": "和营长下井字棋", "g_tt_desc": "一分钟一局：你是 X，营长是 O",
  "g_tt_title": "井字棋 · 营长", "g_tt_score": "你 %1$d · 营长 %2$d · 平局 %3$d", "g_new": "新游戏",
  "g_tt_start": ["轮到你了。营长像点名时一样等着。", "你先走。营长今天很大方。"],
  "g_tt_move": ["营长下了个 O，去喝咖啡了。", "营长：“正如计划。”", "营长想了 0.3 秒。就像审批假条一样。", "营长挡住了。就像挡住你的假期。"],
  "g_tt_win": ["你赢了！营长一惊，批了你的假条。", "三连！营长说这是演习。"],
  "g_tt_lose": ["营长赢了。他说这是为你好。", "O 赢了。假条退回重写。"],
  "g_tt_draw": ["平局。两人一起去抽烟休息。", "平局。轮换又推迟了。"],
  "g_hl_name": "更高还是更低？", "g_hl_desc": "猜下一个休假概率是更高还是更低。连对七次，假期就是你的！",
  "g_hl_title": "更高还是更低？· 休假", "g_hl_up": "▲ 更高", "g_hl_down": "▼ 更低", "g_hl_streak": "连对 %1$d/7 · 最佳 %2$d",
  "g_hl_start": "这是现在的休假概率。下一个会更高还是更低？",
  "g_hl_right": ["猜对了！预报员紧张了。", "对！你能预见轮换。", "没错。营长问你怎么知道的。"],
  "g_hl_wrong": ["不对。预报照例毫无预警地变了。", "没猜中。连胜退回重写。"],
  "g_hl_win": "连对七次！假期批准了 🏖 点一下再玩。",
  "g_th_name": "托尔在玩", "g_th_desc": "托尔用锤子敲遍眼前的一切。然后……", "g_th_title": "托尔 · 锤子", "g_th_hit": "⚡ 敲", "g_th_count": "已敲 %1$d/12", "g_th_lines": ["托尔敲了一朵云。下雨了。", "托尔敲了一张假条。假条自己签好了。", "托尔修好了发电机。一锤搞定。", "托尔敲了政务大厅的队伍。队伍让开了。", "托尔在会议室钉了颗钉子。现在挂上了一幅画。", "托尔敲了早上 5:45 的闹钟。闹钟再也不响了。", "托尔打开了果酱罐。第二锤才开。", "托尔敲了一面鼓。会议室的人都在跳舞。", "托尔敲开了一颗坚果。松鼠惊呆了。", "托尔敲了铁砧。邻居一点也不惊讶，早就习惯了。", "托尔打破了僵局。在和岳母聊天的时候。", "托尔又挥起了锤子……"], "g_th_final": "Hammer time.", "g_th_look": "（托尔停下来，直直看向镜头）", "g_th_again": "点一下，让托尔接着玩"},
}
FOLDER = {"uk": "values", "en": "values-en", "nl": "values-nl", "ar": "values-ar", "zh": "values-zh"}
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace("'", "\\'").replace('"', '\\"')
for lang, d in T.items():
    out = ['<?xml version="1.0" encoding="utf-8"?>', "<!-- generated by tools/widget-games.py -->", "<resources>"]
    for k, v in d.items():
        if isinstance(v, list):
            out.append(f'    <string-array name="{k}">' + "".join(f"<item>{esc(x)}</item>" for x in v) + "</string-array>")
        else:
            fmt = "true" if "%1$d" in v else "false"
            out.append(f'    <string name="{k}" formatted="{fmt}">{esc(v)}</string>')
    out.append("</resources>")
    p = os.path.join(ROOT, "app/android/app/src/main/res", FOLDER[lang], "game_strings.xml")
    open(p, "w").write("\n".join(out) + "\n")
# iOS: Ukrainian or English, like the other widgets
def sw(v):
    if isinstance(v, list): return "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in v) + "]"
    return json.dumps(v.replace("%1$d", "%d").replace("%2$d", "%d").replace("%3$d", "%d"), ensure_ascii=False)
lines = ["// Generated by tools/widget-games.py", "import Foundation", "", "enum GS {"]
for k in T["uk"]:
    name = "".join(p.capitalize() if i else p for i, p in enumerate(k[2:].split("_")))
    typ = "[String]" if isinstance(T["uk"][k], list) else "String"
    lines.append(f"    static let {name}: {typ} = WS.isUk ? {sw(T['uk'][k])} : {sw(T['en'][k])}")
lines.append("}")
open(os.path.join(ROOT, "app/ios/App/VaibvetWidgets/GameStrings.swift"), "w").write("\n".join(lines) + "\n")
print("ok")
