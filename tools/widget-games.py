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
  "g_hl_win": "Сім поспіль! Відпустку затверджено 🏖 Тисни, щоб грати ще."},
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
  "g_hl_win": "Seven in a row! Leave approved 🏖 Tap to play again."},
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
  "g_hl_win": "Zeven op rij! Verlof goedgekeurd 🏖 Tik om nog eens te spelen."},
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
  "g_hl_win": "سبع مرات متتالية! تمت الموافقة على الإجازة 🏖 المس لتلعب مجدداً."},
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
  "g_hl_win": "连对七次！假期批准了 🏖 点一下再玩。"},
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
