# Copilot Instructions

## Architecture At A Glance
- `CmdntBackend` hosts a .NET 8 Web API (project `CmdntApi`) plus a shared `DataLayer`; controllers live under `CmdntBackend/CmdntApi/Controllers`, while entity definitions/mappers/DTOs sit under `CmdntBackend/DataLayer`.
- `frontend` is a Vite + React 19 SPA built with TypeScript, Bootstrap, CSS modules, and custom UI primitives (`components/ActionButton`, `CommonTable`, `Tabs`).
- All API routes are versioned under `/api/v1/...` and return either DTOs (via `DataLayer/DTOs/*Mapper.cs`) or `ApiErrorDto` for failures; frontend types in `frontend/src/types` mirror those DTOs 1:1.
- Authentication flows through `AccountController.SignIn` → `TokenService.GenerateToken`; the SPA stores the JWT in a cookie (`authToken`) and mirrors the payload inside `sessionStorage` for role-based routing.

## Backend Notes
- `Program.cs` wires MySQL (`DefaultConnection` + env var `DB_PASSWORD`) and JWT auth (`JWT:Key`); `builder.Services.AddControllers()` suppresses automatic model-state failures, so every controller explicitly checks `ModelState`.
- Keep DTO mapping logic inside `DataLayer/DTOs/*Mapper.cs` (e.g., `StudentMapper.ToDto`) and load navigation properties before calling `ToDto` because mappers assume related entities (`Group`, `Rooms`) are already included.
- Central error semantics live in `DataLayer/DTOs/ApiErrorDto`; reuse it for every non-200 result to stay consistent with the global exception handler defined at the bottom of `Program.cs`.
- When touching persistence, update `DataLayer/Models`, `AppDbContext`, and the EF migrations under `CmdntBackend/DataLayer/Migrations`; run `dotnet ef database update --project CmdntBackend/DataLayer --startup-project CmdntBackend/CmdntApi` after adding migrations.

## Frontend Notes
- API traffic must go through `frontend/src/api/client.ts`; `requestWithAuth` automatically adds `Authorization` headers and redirects to `/` on HTTP 401. Add new backend endpoints here first, then import them elsewhere.
- Router configuration lives in `frontend/src/App.tsx` and `main.tsx`. Each route may declare `handle.title` and `handle.requiredRole`; `ProtectedRoute` checks those flags using role names in Russian (“Администратор”, “Комендант”, “Воспитатель”) pulled from `sessionStorage.userSession`.
- Data-heavy screens rely on hooks such as `hooks/useStudentData.ts` (fetches student, contacts, ext info) and `hooks/useRoomData.ts` (room + neighbours). Extend or reuse them instead of duplicating fetch logic.
- UI building blocks (`components/CommonTable`, `Tabs`, `ActionButton`, modal components) expect CSS modules that already live beside them; follow that pattern for consistent styling, and remember tables use column descriptors with dot-path keys (`group.course`).

## Feature Conventions
- Students: `pages/Dashboard/Students/StudentsLayout.tsx` handles listing, filtering, Excel export (via `xlsx`), and multi-contact forms (max 5 contacts, phone regex `^8\d{10}$`). Student detail tabs (`pages/Dashboard/StudentCard`) persist active tab to `sessionStorage` and store notes locally (`localStorage` key `student-notes-{id}`)—there is no backend for notes yet.
- Rooms: `RoomsController` enforces capacity and gender rules before attaching students; the frontend’s housing tab (`HousingInfoTab`) calls `apiClient.getRoomById` and `getStudentsByRoomId`, so any schema changes there must update both DTOs and the hook.
- Users & Roles: Passwords are BCrypt’d (`UsersController.PatchPassword`), and statistics endpoints aggregate counts by localized role names. Keep those strings in sync with what the SPA expects when gating UI.

## Developer Workflow
- Backend: `dotnet restore CmdntBackend/CmdntBackend.sln` → `dotnet watch run --project CmdntBackend/CmdntApi`; provide `DB_PASSWORD`, `JWT__Key`, and optionally `ASPNETCORE_ENVIRONMENT` via user secrets or environment variables. Swagger is available at `http://localhost:5000/swagger`.
- Frontend: `npm install --prefix frontend` → `npm run dev --prefix frontend` (defaults to `http://localhost:5173`); set `VITE_API_URL=http://localhost:5000` in `frontend/.env` when pointing at a different backend host.
- Builds: `npm run build --prefix frontend` emits static assets under `frontend/dist`; `dotnet publish CmdntBackend/CmdntApi -c Release` produces the API artifact.
- If you host the frontend somewhere other than `http://localhost:5173`, also update the CORS policy named `AllowFrontend` inside `Program.cs`.

## Quick Reference
- Auth flow: `AccountController` → `TokenService` → cookie `authToken` + `sessionStorage.userSession`.
- Shared DTOs: `CmdntBackend/DataLayer/DTOs/**` ↔ `frontend/src/types/**`.
- Templates for printable layouts live in `Templates/` (Russian HTML prototypes) and are not part of the build but useful for UI styling cues.
