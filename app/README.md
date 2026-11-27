# Вайбкет FM: мобільні застосунки

Оболонки для Android та iOS на Capacitor. Вміст беруть із `../index.html`.

    npm ci
    npm run sync          # копіює сайт у www/ і оновлює обидві платформи
    npx cap open ios      # потрібен Mac з Xcode
    npx cap open android  # потрібна Android Studio

Android-збірку (debug APK) робить GitHub Actions після кожної зміни; файл лежить у вкладці Actions, у розділі Artifacts.

## до Андрійка

Вікно продовжує фразу голосом Андрія. Уривки й пошук їдуть разом із сайтом (`vendor/andriyko-corpus.js`). Адреса моделі — у `vendor/andriyko-config.js`, і в репозиторії вона порожня: без неї вікно працює офлайн. Ключ у файл не пиши. Його вставляють у самому вікні (лишається на пристрої) або тримають у проксі:

    ANDRIYKO_KEY=… node tools/andriyko-proxy.js

Проксі слухає `http://127.0.0.1:8787/v1/chat/completions`. З телефону це не той комп'ютер, тож для застосунку проксі має бути за адресою, яку бачить пристрій.
