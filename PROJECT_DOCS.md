# Foody MVP — документация проекта

> Репозиторий: `Petrushaa/foodyMVP`
> Дата: 2026-05-20

## 1) Что это за проект

**Foody** — MVP-приложение про еду: лента постов с блюдами/ресторанами, лайки/сохранения/комментарии, профиль пользователя, а также модерация контента.

Проект состоит из:
- **Backend**: Django + Django REST Framework (Python)
- **Frontend**: Next.js (TypeScript)
- **Infra**: Docker Compose (PostgreSQL, Redis, Celery, Caddy как reverse-proxy)

Языки в репозитории (по составу): TypeScript ~59%, Python ~33%, CSS ~6.7%.

## 2) Архитектура (высокий уровень)

В прод/интеграционном окружении сервисы поднимаются в Docker Compose (папка `infra/`).

Компоненты:
- **db**: PostgreSQL 15
- **redis**: Redis 7
- **backend**: Django + Gunicorn (порт контейнера 8000)
- **frontend**: Next.js (порт контейнера 3000)
- **celery_worker** и **celery_beat**: фоновые задачи
- **caddy**: reverse-proxy (порты 80/443)

Маршрутизация через Caddy:
- `/static/*` → отдача Django static из volume
- `/media/*` → отдача user-uploaded media из volume
- `/api/auth/*` → frontend (NextAuth)
- `/api/*` и `/admin/*` → backend
- всё остальное → frontend

## 3) Структура репозитория

```
.
├─ backend/          # Django приложение + API
├─ frontend/         # Next.js приложение
├─ infra/            # docker-compose, Caddyfile, env шаблоны
├─ docs/             # документация по API и функционалу
└─ INFRA.md          # расширенная infra-заметка/чеклист
```

## 4) Быстрый старт (локально через Docker)

### 4.1 Предварительные требования
- Docker
- Docker Compose v2

### 4.2 Подготовка env
В папке `infra/` создайте `.env` на базе примера:

```bash
cp infra/.env.example infra/.env
```

Далее отредактируйте значения (минимум секреты/пароли):
- `DJANGO_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `DJANGO_SUPERUSER_PASSWORD`
- `AUTH_SECRET`
- `DOMAIN_NAME` (для локалки обычно `localhost`)

### 4.3 Запуск

```bash
cd infra
docker compose up -d --build
```

После старта:
- Frontend будет доступен через reverse-proxy (обычно `http://localhost/`)
- Backend API: `http://localhost/api/v1/`
- Swagger UI: `http://localhost/api/docs/`
- Django Admin: `http://localhost/admin/`

> Примечание: Frontend в `docker-compose.yml` билдится с `NEXT_PUBLIC_API_URL` как build-arg.

### 4.4 Полезные команды

```bash
cd infra

# статус сервисов
docker compose ps

# логи
docker compose logs -f backend

# зайти в контейнер backend
docker compose exec backend bash

# миграции вручную
docker compose exec backend python manage.py migrate
```

## 5) Backend (Django)

### 5.1 Технологии
По `backend/requirements.txt`:
- Django
- djangorestframework
- djangorestframework-simplejwt (JWT)
- drf-spectacular (OpenAPI/Swagger)
- Celery
- PostgreSQL (psycopg2)
- Redis (django-redis)

### 5.2 Запуск backend
Backend контейнер стартует через `backend/entrypoint.sh` (в Dockerfile задан как entrypoint). Типичный сценарий:
- ожидание PostgreSQL
- миграции
- collectstatic
- создание superuser (если заданы `DJANGO_SUPERUSER_*`)
- старт Gunicorn

### 5.3 Документация API
См. `docs/api.md`.

Важно:
- Base URL в dev: `http://localhost:8000`, но при запуске через Caddy обычно используете домен/localhost и префикс `/api/v1/`.
- Swagger UI: `GET /api/docs/`
- OpenAPI schema: `GET /api/schema/`

## 6) Frontend (Next.js)

### 6.1 Технологии
- Next.js (App Router)
- TypeScript
- NextAuth (маршруты `/api/auth/*` проксируются на frontend)

### 6.2 Запуск для разработки без Docker
В папке `frontend/`:

```bash
npm install
npm run dev
```

По умолчанию dev-сервер: `http://localhost:3000`.

Подробнее про структуру фронта см. `frontend/README.md`.

## 7) Функционал (что реализовано)

Краткий список функций см. `docs/features.md`.

Суть:
- Аутентификация JWT
- Профиль пользователя
- Посты: лента, создание/редактирование/удаление
- Лайки/сохранения
- Комментарии
- Справочники: рестораны/блюда/категории
- Модерация постов (staff)

## 8) Переменные окружения (.env)

Шаблон: `infra/.env.example`.

Ключевые группы:
- Django: `DJANGO_*`, CORS/CSRF
- Postgres: `POSTGRES_*`
- Redis/Celery: `REDIS_URL`, `UPDATE_STATS_INTERVAL`
- Next.js/NextAuth: `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `AUTH_*`
- Reverse proxy: `DOMAIN_NAME`

## 9) Деплой / инфраструктура

Подробный, «человеческий» документ по инфраструктуре: `INFRA.md`.

Там есть:
- описание сервер��
- схема сервисов
- bootstrap нового сервера
- рекомендации по firewall/SSL
- известные проблемы и техдолг

## 10) Где смотреть документацию в репозитории

- `docs/api.md` — гайд по API для фронтенда
- `docs/features.md` — перечень функций и эндпоинтов
- `INFRA.md` — инфраструктура, деплой, env, домен/DNS, чеклисты
- `frontend/README.md` — локальная разработка фронта

---

Если хочешь — сделаю ещё **короткий README в корне репозитория** (или расширю этот документ под твой формат: для разработчика / для продакта / для деплоя).