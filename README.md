# Foody MVP 🍽️

MVP-приложение про еду: лента постов с блюдами и ресторанами, лайки, сохранения и комментарии, профиль пользователя и модерация контента.

## 🧱 Стек

- **Backend** — Django 5 + Django REST Framework (Python)
- **Frontend** — Next.js 15 + React 19 (TypeScript)
- **Infra** — Docker Compose: PostgreSQL 15, Redis 7, Celery (worker + beat), Caddy как reverse-proxy

## 📂 Структура репозитория

```
.
├─ backend/    # Django-приложение и REST API (posts, foody, users)
├─ frontend/   # Next.js (TypeScript) клиент
├─ infra/      # Docker Compose, конфигурация Caddy, окружение
├─ docs/       # дополнительная документация
├─ PROJECT_DOCS.md   # подробное описание проекта и архитектуры
└─ INFRA.md          # инфраструктура и деплой
```

## 🚀 Быстрый старт (Docker)

```bash
cd infra
cp .env.example .env      # заполнить переменные окружения
docker compose up --build
```

После старта:
- Frontend — `http://localhost` (через Caddy)
- API — `http://localhost/api/`
- Admin — `http://localhost/admin/`

## 🛠️ Локальная разработка

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## ✨ Возможности

- Лента постов о блюдах и ресторанах с тегами и категориями
- Лайки, сохранения и комментарии (со своими лайками)
- Профиль пользователя
- Модерация контента и подсчёт статистики постов/тегов (Celery-задачи)
- REST API с фильтрацией и пагинацией

## 🧪 Тесты

```bash
cd backend
pytest
```

## 📖 Документация

Подробности — в [PROJECT_DOCS.md](PROJECT_DOCS.md) (архитектура, API, модели данных) и [INFRA.md](INFRA.md) (инфраструктура и деплой).
