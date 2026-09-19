"""
Ограничение перебора на форме входа в админку.

Проверяем не только сам лимит, но и две вещи, ради которых он и писался
именно так: успешный вход не должен мешать администратору работать, а
подстановка чужого адреса в X-Forwarded-For не должна давать обход.
"""

import pytest
from django.core.cache import cache
from django.urls import reverse

from users.middleware import CACHE_PREFIX
from users.models import User

PASSWORD = 'Sup3rSecret!pass'


@pytest.fixture
def staff(db):
    return User.objects.create_user(
        username='root',
        email='root@test.com',
        password=PASSWORD,
        is_staff=True,
        is_superuser=True,
        email_verified=True,
    )


@pytest.fixture
def login_url():
    return reverse('admin:login')


@pytest.mark.django_db
class TestAdminLoginThrottle:
    def test_перебор_упирается_в_лимит(self, client, staff, login_url, settings):
        settings.ADMIN_LOGIN_MAX_ATTEMPTS = 3

        for _ in range(3):
            response = client.post(login_url, {'username': 'root', 'password': 'wrong'})
            # Форма с ошибкой — значит попытка дошла до админки и не прошла.
            assert response.status_code == 200

        response = client.post(login_url, {'username': 'root', 'password': 'wrong'})
        assert response.status_code == 429
        assert response['Retry-After']

    def test_успешный_вход_обнуляет_счётчик(self, client, staff, login_url, settings):
        settings.ADMIN_LOGIN_MAX_ATTEMPTS = 3

        client.post(login_url, {'username': 'root', 'password': 'wrong'})
        client.post(login_url, {'username': 'root', 'password': 'wrong'})
        assert cache.get(f'{CACHE_PREFIX}127.0.0.1') == 2

        response = client.post(login_url, {'username': 'root', 'password': PASSWORD})
        assert response.status_code == 302
        # Администратор, который ошибся парой символов и потом вошёл, не должен
        # донашивать эти попытки до следующего раза.
        assert cache.get(f'{CACHE_PREFIX}127.0.0.1') is None

    def test_подмена_x_forwarded_for_не_обходит_лимит(self, client, staff, login_url, settings):
        settings.ADMIN_LOGIN_MAX_ATTEMPTS = 2
        # Первый элемент прислал сам клиент, последний дописал прокси.
        spoofed = {'HTTP_X_FORWARDED_FOR': '1.2.3.4, 10.0.0.9'}

        for _ in range(2):
            client.post(login_url, {'username': 'root', 'password': 'wrong'}, **spoofed)

        # Клиент меняет «свой» адрес в начале списка — реальный тот же.
        response = client.post(
            login_url,
            {'username': 'root', 'password': 'wrong'},
            HTTP_X_FORWARDED_FOR='9.9.9.9, 10.0.0.9',
        )
        assert response.status_code == 429
        assert cache.get(f'{CACHE_PREFIX}10.0.0.9') == 2

    def test_чужой_адрес_не_блокируется(self, client, staff, login_url, settings):
        settings.ADMIN_LOGIN_MAX_ATTEMPTS = 2

        for _ in range(2):
            client.post(
                login_url, {'username': 'root', 'password': 'wrong'},
                HTTP_X_FORWARDED_FOR='1.1.1.1, 10.0.0.9',
            )

        # Лимит адресный: сосед по сервису не должен страдать от чужого перебора.
        response = client.post(
            login_url, {'username': 'root', 'password': 'wrong'},
            HTTP_X_FORWARDED_FOR='1.1.1.1, 10.0.0.77',
        )
        assert response.status_code == 200

    def test_обычные_страницы_не_трогаем(self, client, staff, login_url, settings):
        """Лимит висит только на POST формы входа, а не на админке целиком."""
        settings.ADMIN_LOGIN_MAX_ATTEMPTS = 1

        client.post(login_url, {'username': 'root', 'password': 'wrong'})
        # GET той же страницы после исчерпания лимита остаётся доступным:
        # иначе человек не увидел бы даже форму, чтобы понять, что происходит.
        assert client.get(login_url).status_code == 200
