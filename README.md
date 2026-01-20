# Ignite

## Быстрый старт

### Backend (ASP.NET Core)
```bash
cd backend/src/Ignite.API
dotnet run
```
Сервис поднимется на http://localhost:5000.

### Frontend (Next.js)
```bash
cd frontend
npm install  # при первом запуске
npm run dev
```
Приложение будет на http://localhost:3000 (или 3001, если порт занят).

## Что внутри
- Backend: ASP.NET Core + EF Core, JWT аутентификация, Clean Architecture.
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS.

## Примечания
- Тестовые учетные записи и семпловые сиды удалены.
- Подразумевается подключение к вашей базе SQL Server через `appsettings.json`.