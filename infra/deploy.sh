#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

# ── Настройки ──────────────────────────────────────────────────────────
ENV_FILE=".env"                        # compose сам читает IMAGE_TAG отсюда
PREV_FILE=".env.previous"              # тег предыдущего успешного деплоя
KEEP_IMAGES="${DEPLOY_KEEP_IMAGES:-3}" # сколько старых образов держать на диске
ROLLING_SERVICES=("backend" "frontend")
IMAGES=("ghcr.io/foodyco/foody-backend" "ghcr.io/foodyco/foody-frontend")

current_tag() { grep -E '^IMAGE_TAG=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || true; }

# ── Откат на прежний тег при любой ошибке ──────────────────────────────
on_fail() {
    trap - ERR
    echo "!!! Деплой упал — возвращаю прежний тег"
    local prev; prev=$(grep -E '^IMAGE_TAG=' "$PREV_FILE" 2>/dev/null | cut -d= -f2 || true)
    if [ -n "$prev" ]; then
        echo "IMAGE_TAG=$prev" > "$ENV_FILE"
        docker compose up -d
    fi
}

pull_with_retry() {
    # прокси/сеть могут моргнуть — три попытки с паузой
    for i in 1 2 3; do
        docker compose pull && return 0
        echo "pull не прошёл (попытка $i), жду 10с..."; sleep 10
    done
    return 1
}

do_deploy() {
    local tag="$1"
    [ -n "$tag" ] || { echo "Использование: deploy.sh deploy <tag>"; exit 1; }
    trap on_fail ERR

    # запомнить, откуда уходим (для rollback)
    local cur; cur=$(current_tag)
    [ -n "$cur" ] && echo "IMAGE_TAG=$cur" > "$PREV_FILE"

    echo "IMAGE_TAG=$tag" > "$ENV_FILE"
    echo "-> Тяну образы с тегом $tag..."
    pull_with_retry

    # rolling для веб-сервисов: новый контейнер healthy -> старый гасится
    for svc in "${ROLLING_SERVICES[@]}"; do
        echo "-> Rolling-подмена $svc..."
        docker rollout "$svc"
    done

    # остальные (celery и пр.): обычный up. Стартуют после healthy backend
    # (depends_on) — миграции уже накачены новым backend-контейнером.
    echo "-> Обновляю фоновые сервисы..."
    docker compose up -d

    cleanup_old_images
    echo "== Деплой $tag завершён =="
}

do_rollback() {
    local prev; prev=$(grep -E '^IMAGE_TAG=' "$PREV_FILE" 2>/dev/null | cut -d= -f2 || true)
    [ -n "$prev" ] || { echo "Нет сохранённого предыдущего тега"; exit 1; }
    echo "-> Откат на $prev"
    # свап текущего и предыдущего: откат отката тоже работает
    local cur; cur=$(current_tag)
    echo "IMAGE_TAG=$cur" > "$PREV_FILE"
    echo "IMAGE_TAG=$prev" > "$ENV_FILE"
    docker compose pull || true        # образ обычно ещё на диске
    for svc in "${ROLLING_SERVICES[@]}"; do docker rollout "$svc"; done
    docker compose up -d
    echo "== Откат на $prev завершён =="
}

cleanup_old_images() {
    # держим: текущий тег, предыдущий тег и ещё KEEP_IMAGES самых свежих; latest не трогаем
    local cur prev
    cur=$(current_tag)
    prev=$(grep -E '^IMAGE_TAG=' "$PREV_FILE" 2>/dev/null | cut -d= -f2 || true)
    for image in "${IMAGES[@]}"; do
        docker images "$image" --format '{{.Tag}}' \
          | grep -v -e '^latest$' -e "^${cur}$" ${prev:+-e "^${prev}$"} \
          | tail -n +$((KEEP_IMAGES + 1)) \
          | xargs -r -I{} docker rmi "$image:{}" 2>/dev/null || true
    done
    docker image prune -f >/dev/null
}

do_status() {
    echo "Текущий тег:     $(current_tag)"
    echo "Предыдущий тег:  $(grep -E '^IMAGE_TAG=' "$PREV_FILE" 2>/dev/null | cut -d= -f2 || echo '—')"
    docker compose ps
}

case "${1:-}" in
    deploy)   do_deploy "${2:-}" ;;
    rollback) do_rollback ;;
    status)   do_status ;;
    *) echo "Использование: deploy.sh {deploy <tag>|rollback|status}"; exit 1 ;;
esac
