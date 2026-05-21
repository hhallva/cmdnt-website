# CMDNT Website

Административная панель для управления общежитием: карточки студентов, структура комнат, расселение, пользователи, маршруты доступа. Проект состоит из фронтенда на React/Vite и backend API на ASP.NET Core 8, которые взаимодействуют через JSON API и деплоятся в Docker-контейнерах.

## Архитектура

- **Backend:** `backend/API` – ASP.NET Core 8 Web API + общий слой `Core`. Используется Entity Framework Core, MySQL и JWT-аутентификация. DTO/мапперы хранятся в `Core/DTOs`, миграции – в `Core/Migrations`.
- **Frontend:** `frontend/` – Vite + React 18 + TypeScript. UI строится на собственных компонентах (ActionButton, CommonTable, Tabs и др.) и CSS‑модулях. Все HTTP-запросы идут через `src/api/client.ts`.
- **Инфраструктура:** Docker Compose описывает API, фронтенд и БД. GitHub Actions (`.github/workflows/deploy.yml`) копирует артефакты на сервер и собирает контейнеры, после чего перезапускает Caddy.

## Требования

- Node.js ≥ 18 и npm.
- .NET 8 SDK.
- MySQL 8.x (локально) или совместимый сервер.
- Docker + Docker Compose для прод-сборки/деплоя.

## Полезные команды

| Цель                   | Команда |
|-----------------------|---------|
| Запуск backend        | `dotnet watch run --project backend/API`
| EF миграция           | `dotnet ef migrations add <Name> --project backend/Core --startup-project backend/API`
| Применить миграции    | `dotnet ef database update --project backend/Core --startup-project backend/API`
| Запуск frontend       | `npm run dev --prefix frontend`
| Сборка frontend       | `npm run build --prefix frontend`
| Docker Compose        | `docker compose up -d --build`

## Структура репозитория

```
backend/
	API/            # ASP.NET Core API (Controllers, Program.cs, Dockerfile)
	Core/           # EF Core модели, DTO, миграции
frontend/
	src/
		api/               # HTTP-клиент и эндпоинты
		components/        # Общие UI-компоненты
		hooks/             # Кастомные хуки (структура, расселение, данные)
		pages/             # Экран “Students”, “Structure”, “Users” и пр.
docker-compose.yml     # Контейнеры API, фронта и MySQL
.env				   # Общие переменнеые окружения
.github/workflows/     # Авто-деплой через GitHub Actions
```

## Обратная связь

Нашли баг или хотите добавить функционал? Откройте issue или Pull Request, описав проблему/изменения. Предпочтительно прикладывать скриншоты UI и шаги воспроизведения.
