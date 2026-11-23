# Вайбвет FM: мобільні застосунки

Оболонки для Android та iOS на Capacitor. Вміст беруть із `../index.html`.

    npm ci
    npm run sync          # копіює сайт у www/ і оновлює обидві платформи
    npx cap open ios      # потрібен Mac з Xcode
    npx cap open android  # потрібна Android Studio

Android-збірку (debug APK) робить GitHub Actions після кожної зміни; файл лежить у вкладці Actions, у розділі Artifacts.
