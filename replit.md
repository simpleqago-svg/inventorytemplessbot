# Кофейня Инвентаризация — Telegram Bot

Telegram-бот для инвентаризации кофейни. Сотрудники заполняют склад через inline-кнопки, готовый отчёт отправляется в Telegram-канал.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — запуск API-сервера + Telegram-бота (polling)
- `pnpm --filter @workspace/scripts run seed` — заполнение БД начальными данными (один раз)
- `pnpm --filter @workspace/db run push` — применить изменения схемы БД (dev only)
- `pnpm run typecheck` — полная проверка типов
- `pnpm run build` — typecheck + сборка

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Telegram Bot: Telegraf 4.x (polling, работает внутри api-server процесса)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Logging: pino + pino-pretty
- Build: esbuild (ESM bundle)

## Where things live

- `lib/db/src/schema/index.ts` — схема БД (users, locations, categories, products, active_sessions, inventory_records)
- `artifacts/api-server/src/bot/` — весь код бота
  - `i18n.ts` — переводы EN/SR
  - `state.ts` — in-memory FSM Map (ожидание ввода числа / admin-шаги)
  - `keyboards.ts` — все inline-клавиатуры
  - `db.ts` — все запросы к БД
  - `report.ts` — построение текста отчёта
  - `handlers/start.ts` — /start, выбор языка, выбор локации
  - `handlers/inventory.ts` — категории, товары, ввод данных
  - `handlers/report.ts` — просмотр и отправка отчёта
  - `handlers/admin.ts` — /admin, добавление категорий и товаров
- `scripts/src/seed.ts` — seed-скрипт

## Architecture decisions

- Бот и Express живут в одном процессе (api-server). Polling не конфликтует с HTTP.
- FSM-состояние (ожидание числа от пользователя) хранится в памяти (`Map<userId, step>`). Polling — один процесс, поэтому это безопасно и быстро.
- Один активный сеанс на пользователя + локацию. Несколько сотрудников могут работать параллельно — каждый в своей сессии.
- i18n — простой типизированный объект `{ en: {...}, sr: {...} }`, без сторонних библиотек.
- Admin text flows обрабатываются middleware раньше inventory text handler, по типу waiting-step.

## Product

- `/start` — выбор языка (EN/SR) и локации (Vračar / Dorćol)
- Главное меню категорий с кнопками "Pregled izveštaja" и "Poništi izveštaj"
- Товары с индикатором ✅ если уже заполнены
- Ввод: numeric (текстом), color (светофор), both (число + цвет)
- Просмотр отчёта и отправка в канал с хэштегом `#report_DD_MM_YYYY`
- `/admin` — добавление категорий и товаров без кода

## User preferences

- Интерфейс только на inline-кнопках (editMessageText)
- Чат не засоряется — входящие сообщения пользователей удаляются
- Язык: EN / Srpski

## Gotchas

- После изменений схемы БД: `pnpm --filter @workspace/db run push` → `pnpm --filter @workspace/scripts run seed`
- После изменения кода бота: перезапустить workflow `artifacts/api-server: API Server`
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID` — должны быть в Replit Secrets
- Seed-скрипт безопасен для повторного запуска (onConflictDoNothing)
- Чтобы назначить admin: вручную обновить `is_admin = true` в таблице `users` для нужного Telegram user_id

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
