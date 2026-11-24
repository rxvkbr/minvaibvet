#!/usr/bin/env python3
"""Builds kalendar.ics, the Ministry's public calendar (subscribe: webcal://minvaibvet.pp.ua/kalendar.ics)."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAMP = "20261124T000000Z"

def fold(line):
    b = line.encode("utf-8")
    if len(b) <= 74:
        return line
    out, cur = [], b""
    for ch in line:
        c = ch.encode("utf-8")
        if len(cur) + len(c) > 73:
            out.append(cur.decode("utf-8")); cur = b""
        cur += c
    out.append(cur.decode("utf-8"))
    return "\r\n ".join(out)

def esc(t):
    return t.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")

EVENTS = [
    # uid, start, end, rrule, summary, description, alarm
    ("hvylyna", "DTSTART;TZID=Europe/Kyiv:20261125T090000", "DTEND;TZID=Europe/Kyiv:20261125T090100", "FREQ=DAILY",
     "🕯 Загальнонаціональна хвилина мовчання",
     "Щодня о 9:00 за Києвом. За всіма, чиє життя забрала війна.\nУ цю хвилину Вайбвет FM замовкає разом з країною.", True),
    ("svichka", "DTSTART;TZID=Europe/Kyiv:20261128T160000", "DTEND;TZID=Europe/Kyiv:20261128T161500", "FREQ=YEARLY;BYMONTH=11;BYDAY=4SA",
     "🕯 Запали свічку · пам'ять жертв Голодоморів",
     "Четверта субота листопада, 16:00. Свічка у вікні — для тих, кому не дали хліба. Хліб на столі — для тих, хто вижив, щоб були ми.", True),
    ("shykuvannia", "DTSTART;TZID=Europe/Kyiv:20261130T054500", "DTEND;TZID=Europe/Kyiv:20261130T055000", "FREQ=WEEKLY;BYDAY=MO",
     "Шикування (скасовано)",
     "Жартуємо. Шикування скасовано. Можна спати далі.\nМінвайбвет, сатира. https://minvaibvet.pp.ua", False),
    ("pyatnytsia", "DTSTART;VALUE=DATE:20261127", "DTEND;VALUE=DATE:20261128", "FREQ=WEEKLY;BYDAY=FR",
     "П'ятниця. Без коментарів",
     "Ймовірність відпустки: 0%. Рапорти, подані сьогодні, читатимуть о 17:55.", False),
    ("vykhidnyi", "DTSTART;VALUE=DATE:20261129", "DTEND;VALUE=DATE:20261130", "FREQ=WEEKLY;BYDAY=SU",
     "Вихідний (вчені підтверджують)",
     "Людина прокидається, і нічого не відбувається. Вчені називають це вихідним. Перевіряти, чи це не навчання, не обов'язково.", False),
    ("prognoz", "DTSTART;TZID=Europe/Kyiv:20261129T200000", "DTEND;TZID=Europe/Kyiv:20261129T201000", "FREQ=WEEKLY;BYDAY=SU",
     "Прогноз відпусток на тиждень",
     "Синоптики Мінвайбвету радять тримати рапорт сухим і при собі. Прогноз: https://minvaibvet.pp.ua/#prognoz", False),
    ("rotatsiia", "DTSTART;VALUE=DATE:20261201", "DTEND;VALUE=DATE:20261202", "FREQ=MONTHLY;BYMONTHDAY=1",
     "Ротація (найближчим часом)",
     "Подія, яка завжди відбудеться найближчим часом. Цього місяця перенесено на наступний.", False),
    ("tsnap", "DTSTART;TZID=Europe/Kyiv:20261202T114500", "DTEND;TZID=Europe/Kyiv:20261202T115000", "FREQ=WEEKLY;BYDAY=WE",
     "ЦНАП: кінець прийому документів",
     "Прийом до 11:45. Коронації після 12:00 не реєструються. Вікно №4.", False),
]

VTZ = """BEGIN:VTIMEZONE
TZID:Europe/Kyiv
X-LIC-LOCATION:Europe/Kyiv
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
TZOFFSETTO:+0300
TZNAME:EEST
DTSTART:19700329T030000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
TZOFFSETTO:+0200
TZNAME:EET
DTSTART:19701025T040000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE"""

L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Minvaibvet//Kalendar//UK", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
     "X-WR-CALNAME:Календар Мінвайбвету", "X-WR-CALDESC:Сатира Вайбвет FM, крім хвилини мовчання. https://minvaibvet.pp.ua",
     "X-WR-TIMEZONE:Europe/Kyiv", "REFRESH-INTERVAL;VALUE=DURATION:P1D", "X-PUBLISHED-TTL:P1D"]
L += VTZ.split("\n")
for uid, st, en, rr, summ, desc, alarm in EVENTS:
    L += ["BEGIN:VEVENT", "UID:%s@minvaibvet.pp.ua" % uid, "DTSTAMP:" + STAMP, st, en, "RRULE:" + rr,
          "SUMMARY:" + esc(summ), "DESCRIPTION:" + esc(desc), "TRANSP:TRANSPARENT"]
    if alarm:
        L += ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(summ), "TRIGGER:PT0M", "END:VALARM"]
    L.append("END:VEVENT")
L.append("END:VCALENDAR")
open(os.path.join(ROOT, "kalendar.ics"), "w", newline="").write("\r\n".join(fold(x) for x in L) + "\r\n")
print("kalendar.ics:", len(EVENTS), "events")
