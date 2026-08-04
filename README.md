# Fuel

Личный трекер питания и тренировок. Извлечён из модулей `nutrition`/`workouts`
проекта HabitForge (GetGrip), по образцу того, как модуль `finance` был
извлечён в [Wisely](../Wisely). Next.js (App Router) + Prisma/SQLite,
локально, без деплоя.

## Разработка

```bash
npm install
cp .env.example .env   # задать свой AUTH_SECRET
npm run db:seed        # засеять системную библиотеку упражнений + demo-пользователя
npm run dev
```

## Тесты

```bash
npm run test
npm run lint
npm run build
```
