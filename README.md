# Water Tracker

Автономное PWA-приложение для отслеживания выпитых напитков и эффективной гидратации. Пользовательские данные будут храниться локально на устройстве без авторизации и бэкенда.

Интерфейс построен на shadcn/ui с пресетом `b1G3wwsPg` (`maia`, `mist/blue`, Inter,
Lucide), Tailwind CSS 4 и адаптивными CSS Modules.

## Разработка

Требуется Node.js 22 или новее.

```bash
npm install
npm run dev
```

Основные проверки:

```bash
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run audit:lighthouse
npm run build
```

## Документация

- [Архитектура](./docs/architecture.md)
- [План реализации](./docs/implementation-plan.md)
- [Идеи будущих улучшений](./docs/future-improvements.md)
- [Методика расчёта гидратации](./docs/hydration-methodology.md)

## Production-сборка и публикация

Для публикации из подпапки укажите базовый путь:

```bash
VITE_BASE_PATH=/water-tracker/ npm run build
```

Workflow `.github/workflows/deploy.yml` выполняет проверки, подставляет имя репозитория
в базовый путь и публикует `dist` в GitHub Pages после push в `main`. В настройках
репозитория Pages должен использовать источник **GitHub Actions**.

Production-сборка включает manifest и service worker. После первого открытия по сети
приложение кэширует app shell и может запускаться офлайн. Пользовательские данные
хранятся отдельно в IndexedDB и не удаляются при обновлении service worker.

Lighthouse-аудит запускает production preview в headless Chromium, сохраняет отчёты
в `lighthouse-reports` и проверяет минимальные оценки: Performance 80, Accessibility 90,
Best Practices 90 и SEO 90.

Основные маршруты загружаются отдельными чанками. Экран «Сегодня» входит в стартовую
сборку, а каталог, история и настройки загружаются по требованию.
