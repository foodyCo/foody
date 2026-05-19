import pytest
from config.celery import app as celery_app


@pytest.fixture(autouse=True)
def celery_eager():
    """Run Celery tasks synchronously in tests."""
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True
    yield
    celery_app.conf.task_always_eager = False
    celery_app.conf.task_eager_propagates = False


@pytest.fixture(autouse=True)
def disable_throttling(settings):
    """Disable API throttling in tests to avoid rate limit errors."""
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        'DEFAULT_THROTTLE_CLASSES': [],
    }


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """
    Login throttle (LoginRateThrottle / 10 per minute) attached directly to
    /auth/token/ view via throttle_classes — DEFAULT_THROTTLE_CLASSES=[] override
    в disable_throttling не убирает per-view throttle. Чистим кэш между тестами
    чтобы каждый тест начинал с пустым счётчиком.
    """
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()
