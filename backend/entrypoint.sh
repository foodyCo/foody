#!/bin/bash
set -e

# Если контейнеру переданы аргументы — выполняем их вместо стандартного запуска.
# Так работают celery_worker и celery_beat: их `command:` из compose приходит
# сюда аргументами, и exec запускает celery вместо gunicorn.
# Это же позволяет выполнить разовую команду: `docker compose run backend bash`.
if [ $# -gt 0 ]; then
    echo "Выполняю переданную команду: $@"
    exec "$@"
else
    # Аргументов нет — стандартный запуск бэкенда.
    # Ожидание PostgreSQL не нужно: compose стартует контейнер только после
    # healthcheck БД (depends_on: condition: service_healthy).
    echo "Примение миграции..."
    python manage.py migrate --noinput
    echo "Сбор статики..."
    python manage.py collectstatic --noinput
    echo "Создание суперпользователя..."
    python manage.py createsuperuser --noinput || true
    echo "Запуск сервера..."
    exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
fi
