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

## Локальный запуск

### Backend

1. Перейдите в корень backend: `cd backend`.
2. Установите зависимости: `dotnet restore backend.sln`.
3. Примените миграции (укажите пароль БД):
	 ```powershell
	 dotnet ef database update --project Core --startup-project API
	 ```
4. Создайте `API/appsettings.Development.json` (или User Secrets) со значениями подключения MySQL и `JWT:Key`.
5. Запустите API: `dotnet watch run --project API` (по умолчанию http://localhost:5000).

### Frontend

1. `cd frontend`.
2. Установите зависимости: `npm install`.
3. Создайте файл `.env` и задайте API URL, например:
	 ```env
	 VITE_API_URL=http://localhost:5000
	 ```
4. Запустите Vite dev server: `npm run dev` (http://localhost:5173).

> SPA хранит JWT в cookie `authToken` и сохраняет payload в `sessionStorage.userSession`, поэтому убедитесь, что оба приложения работают на согласованных доменах/портов с разрешёнными CORS.

## Docker-сборка локально

1. Заполните `.env` в корне проекта (см. секцию ниже).
2. Выполните `docker compose up -d --build`.
3. После первого запуска БД инициализируется dump-скриптом (`dump.sql`, если включён в compose) или через миграции.

## Конфигурация окружения (.env)

На сервере файл `.env` создаётся GitHub Actions из secrets. Пример содержимого:

```env
DB_ROOT_PASSWORD=...
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_VOLUME_NAME=...

ASPNETCORE_ENVIRONMENT=Production
JWT_KEY=...
FRONTEND_API_URL=http://localhost:5000

VITE_API_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Дополнительно для фронтенда нужен `VITE_API_URL` в `frontend/.env`.

## CI/CD

Workflow `deploy.yml` делает следующее:

1. Клонирует репозиторий на раннер.
2. Копирует весь проект на сервер через `appleboy/scp-action` (используются secrets `HOST`, `USERNAME`, `SSH_KEY`).
3. Создаёт/обновляет `.env` по значениям secrets (`DB_*`, `JWT_KEY`, `FRONTEND_API_URL`, `CORS_ORIGINS`, `DB_VOLUME_NAME`).
4. Выполняет `docker compose down && docker compose up -d --build`, создаёт volume для БД.
5. Перезагружает Caddy и проверяет доступность сайта curl-запросом.

Чтобы workflow не падал:
- убедитесь, что все перечисленные secrets созданы в `Settings → Secrets and variables → Actions` репозитория;
- при деплое из fork secrets недоступны – запускайте workflow из основного репозитория.

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
.github/workflows/     # Авто-деплой через GitHub Actions
```

## Обратная связь

Нашли баг или хотите добавить функционал? Откройте issue или Pull Request, описав проблему/изменения. Предпочтительно прикладывать скриншоты UI и шаги воспроизведения.
