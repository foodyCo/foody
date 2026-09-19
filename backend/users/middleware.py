"""
Ограничение перебора на форме входа в админку.

API-ручки закрыты троттлингом (`/api/v1/auth/token/` — 10 попыток в минуту), а
форма входа админки уходит в Django напрямую и не была ограничена ничем:
staff-аккаунт можно было перебирать с любой скоростью.

Считаются только неудачные попытки — успешный вход счётчик обнуляет, поэтому
администратор, который просто пришёл работать, ограничения не замечает.
Блокировка временная, на окно: запереть себя навсегда нельзя. Этим подход и
отличается от basic_auth или белого списка адресов, где неверная настройка
означает потерю доступа к админке до правки конфига на сервере.
"""

import logging

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from django.urls import NoReverseMatch, reverse

logger = logging.getLogger(__name__)

CACHE_PREFIX = 'admin-login-attempts:'


class AdminLoginRateLimitMiddleware:
    """Отдаёт 429 на форму входа в админку после серии неудачных попыток."""

    def __init__(self, get_response):
        self.get_response = get_response
        self._login_path = None

    def __call__(self, request):
        if not self._is_login_attempt(request):
            return self.get_response(request)

        key = CACHE_PREFIX + self._client_ip(request)
        window = settings.ADMIN_LOGIN_ATTEMPT_WINDOW

        if (cache.get(key) or 0) >= settings.ADMIN_LOGIN_MAX_ATTEMPTS:
            logger.warning(
                'Превышен лимит попыток входа в админку с адреса %s',
                self._client_ip(request),
            )
            response = HttpResponse(
                'Слишком много попыток входа. Попробуйте позже.',
                content_type='text/plain; charset=utf-8',
                status=429,
            )
            response['Retry-After'] = str(window)
            return response

        response = self.get_response(request)

        # Успешный вход админка отдаёт редиректом, неудачный — снова формой.
        if response.status_code == 302:
            cache.delete(key)
        else:
            self._register_failure(key, window)
        return response

    def _is_login_attempt(self, request):
        return request.method == 'POST' and request.path == self.login_path

    @property
    def login_path(self):
        """Путь формы входа берём у самой админки, а не строкой в коде."""
        if self._login_path is None:
            try:
                self._login_path = reverse('admin:login')
            except NoReverseMatch:
                self._login_path = '/admin/login/'
        return self._login_path

    @staticmethod
    def _client_ip(request):
        """
        Адрес клиента за обратным прокси.

        Берём ПОСЛЕДНИЙ элемент X-Forwarded-For, а не первый. Заголовок,
        пришедший от клиента, подделывается как угодно, а Caddy дописывает
        реальный адрес в конец — значит доверять можно только хвосту. По
        первому элементу лимит обходится подстановкой нового адреса в каждый
        запрос, то есть не работает вовсе.
        """
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded:
            return forwarded.split(',')[-1].strip()
        return request.META.get('REMOTE_ADDR') or 'unknown'

    @staticmethod
    def _register_failure(key, window):
        # add ставит значение только если ключа ещё нет: окно отсчитывается от
        # первой неудачи и не продлевается каждой следующей, иначе адрес
        # оставался бы заблокированным, пока в него долбятся.
        cache.add(key, 0, timeout=window)
        try:
            cache.incr(key)
        except ValueError:
            # Ключ истёк между add и incr — начинаем окно заново.
            cache.set(key, 1, timeout=window)
