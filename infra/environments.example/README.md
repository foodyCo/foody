# Переменные окружения

Шаблоны env-файлов для сервисов из `docker-compose.yml`.

Для запуска скопируй директорию и заполни реальные значения:

```bash
cp -r environments.example .environments
```

Директория `.environments/` в `.gitignore` — секреты в репозиторий не попадают.

| Файл | Сервис(ы) |
|------|-----------|
| `postgres_env` | db |
| `backend_env` | backend |
| `celery_env` | celery_worker, celery_beat |
| `frontend_env` | frontend |
| `caddy_env` | caddy |
