# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foody is a social network for sharing restaurant dish experiences. Users create posts about dishes they've eaten, follow other users, and browse a moderated feed. Stack: Django 5.2 REST API + Next.js 15 frontend + Celery + PostgreSQL + Redis.

## Development Environment

**The project runs exclusively in Docker.** Do not run the backend or frontend locally — use docker-compose.

```bash
cd infra && docker-compose up -d       # Start all services (detached)
cd infra && docker-compose down        # Stop all services
cd infra && docker-compose logs -f backend   # Stream backend logs
```

All services exposed via nginx at `http://localhost`. The `.env` file must exist at `infra/.env` (copy from `infra/.env.example`). Default dev credentials: `admin@example.com` / `admin123`.

### Tests
```bash
cd backend
pytest                                 # All tests
pytest posts/tests/test_posts.py       # Single test file
pytest posts/tests/ -k "test_create"   # Run tests matching name
pytest -v --cov                        # With coverage report
```

API docs are available at `http://localhost:8000/api/docs/` (Swagger UI via drf-spectacular).

## Architecture

### Request Flow
```
Browser → nginx (80/443)
  ├── /api/auth/*     → Next.js (NextAuth routes)
  ├── /api/*          → Django backend
  ├── /admin/*        → Django admin
  ├── /static/*       → Static files (served directly)
  ├── /media/*        → Media files (served directly)
  └── /*              → Next.js frontend
```

### Authentication
- Users log in with **email + password** (not username)
- Django uses a custom `EmailBackend` in `users/auth_backends.py`
- Django issues JWT tokens via `djangorestframework-simplejwt`
- Frontend uses NextAuth v5 (Credentials provider) in `frontend/src/auth.ts`
- NextAuth stores Django JWT access/refresh tokens in its own JWT session
- Auto-refresh happens 60 seconds before token expiry
- API requests from frontend include `Authorization: Bearer <access_token>`

### Backend API Structure
- Base URL: `/api/v1/`
- Auth: `POST /api/v1/auth/token/` (login), `POST /api/v1/auth/token/refresh/`
- Users: `/api/v1/users/` — register, me, profile, follow/unfollow
- Posts: `/api/v1/posts/` — CRUD + actions (like, save, review, my_posts, saved_posts)
- Restaurants: `/api/v1/restaurants/`
- Moderation: `/api/v1/moderation/` (staff only)

ViewSets use DRF DefaultRouter. Custom actions use `@action` decorator.

### Post Lifecycle
1. Post created with `status='pending'`
2. Staff moderator approves/rejects via `/api/v1/moderation/`
3. Approved posts visible to all; rejected posts get a `rejection_reason`
4. Celery Beat task `update_post_ratings` runs periodically to recalculate average ratings from `PostReview` objects

### Key Models
- `Post` → ForeignKey(User, Restaurant, Dish), ManyToMany(Tag), OneToOne(PostStatistics)
- `PostStatistics` — auto-created via signal, holds like/save/comment counts and rating
- `Follow` — User follows User (unique constraint on follower+following pair)
- Counters updated atomically using Django `F()` expressions via Celery tasks

### Frontend Data Flow
- `frontend/src/lib/api.ts` — central API request helper, attaches Bearer token from NextAuth session
- `frontend/src/app/actions/` — Next.js Server Actions for mutations (create post, update profile, etc.)
- `frontend/src/lib/data.ts` — TypeScript type definitions
- Pages in `(auth)/` are public; pages in `(main)/` require authentication

### Async Tasks (Celery)
- Worker and Beat both use `config.celery` (app located at `backend/config/celery.py`)
- `update_post_ratings` — batch-recalculates ratings for all posts with reviews
- `update_likes_count`, `update_saves_count`, `update_comments_count` — atomic counter updates
- In tests, Celery runs in ALWAYS_EAGER mode (configured in `backend/conftest.py`)

## Environment Variables

Copy `infra/.env.example` to `infra/.env`. Key variables:

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` for dev |
| `POSTGRES_*` | Database credentials |
| `REDIS_URL` | Redis connection string |
| `NEXT_PUBLIC_API_URL` | Public-facing API URL (used by browser) |
| `INTERNAL_API_URL` | Backend URL for server-side Next.js requests |
| `AUTH_SECRET` | NextAuth secret |
| `UPDATE_STATS_INTERVAL` | Celery Beat interval for rating updates (seconds) |

## Known Frontend ↔ Backend Gaps

| Issue | Status |
|---|---|
| `GET /posts/following/` — endpoint missing, friends feed silently empty | Fixed in backend (action added) |
| `GET /tags/` — no endpoint; `getTags()` server action always returns `[]` | Not implemented |
| `CommentSerializer` returns `user` as ID integer + `username` string, but frontend expects `user_detail` object | Fixed in backend serializer |
| Categories in create post page were hardcoded; now fetched from `/categories/` | Fixed |
| `getCurrentUserAvatar()` in social.ts returned null (stale comment) | Fixed |

## Known Hardcoded / Mock UI

- `restaurant/[id]/page.tsx` — "Открыто (моки)", fake booking button, fake description
- `search/page.tsx` — filter chips (`"⭐ 4+"`, `"Рядом"`, `"Открыто сейчас"`, `"До 1000 ₽"`) and distance `"1.2 км"` are decorative/unimplemented
- `settings/page.tsx` — version string `"Foody App Version 1.0.4 (Build 42)"` is hardcoded
- Dish detail page `userStatus` shows hardcoded `"Гурман"` label under author name

## Key Implementation Details

- **Queryset optimization**: Views use `select_related` and `prefetch_related` extensively to avoid N+1 queries
- **Media files**: Stored in `/media/`, served by nginx in production; `MEDIA_ROOT` configured in settings
- **CORS**: Configured in `settings.py` via `django-cors-headers`; `CORS_ALLOWED_ORIGINS` must include the frontend origin
- **Migrations**: Two custom migration files for Follow model (`0003_follow.py`) and city field (`0004_user_city.py`) are in `backend/users/migrations/`
- **Staff panel**: Frontend at `(main)/staff/` mirrors the moderation API; only accessible to users with `is_staff=True`
