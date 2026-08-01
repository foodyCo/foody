import pytest
from django.urls import reverse
from posts.models import Restaurant, Dish, Category, Post, DishType
from users.models import User
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client):
    user = User.objects.create_user(username="testuser", email="test@mail.com", password="pwd")
    response = api_client.post(reverse('token_obtain_pair'), {"email": "test@mail.com", "password": "pwd"})
    token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client, user

@pytest.fixture
def staff_client():
    client = APIClient()
    user = User.objects.create_user(username="staffuser", email="staff@mail.com", password="pwd", is_staff=True)
    response = client.post(reverse('token_obtain_pair'), {"email": "staff@mail.com", "password": "pwd"})
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
    return client

@pytest.mark.django_db
class TestRestaurantsViews:
    
    def test_restaurant_search(self, auth_client):
        """
        Тест: Поиск ресторана по названию
        """
        client, _ = auth_client
        Restaurant.objects.create(name="McDonalds", address="Lenina 1")
        Restaurant.objects.create(name="KFC", address="Lenina 2")
        
        url = reverse('restaurant-list')
        
        # Запрос без поиска - отдает все
        res_all = client.get(url)
        assert res_all.status_code == 200
        assert len(res_all.data['results']) == 2
        
        # Поиск по имени
        res_search = client.get(f"{url}?search=McDonalds")
        assert res_search.status_code == 200
        assert len(res_search.data['results']) == 1
        assert res_search.data['results'][0]['name'] == "McDonalds"

    def test_dish_search_by_restaurant(self, auth_client):
        """
        Тест: Получение списка блюд конкретного ресторана и поиск по ним
        """
        client, _ = auth_client
        r1 = Restaurant.objects.create(name="R1", address="A1")
        r2 = Restaurant.objects.create(name="R2", address="A2")
        
        Dish.objects.create(name="Pizza", restaurant=r1)
        Dish.objects.create(name="Pasta", restaurant=r1)
        Dish.objects.create(name="Sushi", restaurant=r2)
        
        url = reverse('dish-list')
        
        # Фильтрация по ресторану
        res_r1 = client.get(f"{url}?restaurant_id={r1.id}")
        assert res_r1.status_code == 200
        assert len(res_r1.data['results']) == 2
        
        # Поиск внутри ресторана
        res_r1_search = client.get(f"{url}?restaurant_id={r1.id}&search=Pizza")
        assert res_r1_search.status_code == 200
        assert len(res_r1_search.data['results']) == 1
        assert res_r1_search.data['results'][0]['name'] == "Pizza"


@pytest.mark.django_db
class TestCategoryViews:

    def test_list_categories_authenticated(self, auth_client):
        """Авторизованный пользователь получает список категорий (сиды + созданные)."""
        client, _ = auth_client
        Category.objects.create(name="Суши")
        Category.objects.create(name="Паста")

        response = client.get(reverse('category-list'))
        assert response.status_code == 200
        names = {item['name'] for item in response.data['results']}
        # Созданные в тесте видны вместе с засеянными справочными категориями
        assert {"Суши", "Паста"} <= names
        assert "Фастфуд" in names  # из сид-миграции

    def test_list_categories_unauthenticated(self, api_client):
        """
        R7-fix: каталог категорий публичный (anon-юзер должен видеть
        категории на /search и /categories страницах без логина).
        """
        Category.objects.create(name="Суши")
        Category.objects.create(name="Паста")
        response = api_client.get(reverse('category-list'))
        assert response.status_code == 200
        # Сид-миграция 0019 добавляет базовые категории, поэтому проверяем
        # вхождение созданных, а не точное количество.
        names = {c['name'] for c in response.data['results']}
        assert {"Суши", "Паста"} <= names

    def test_retrieve_category(self, auth_client):
        """Авторизованный пользователь может получить категорию по id."""
        client, _ = auth_client
        category = Category.objects.create(name="Молекулярная кухня")

        response = client.get(reverse('category-detail', kwargs={'pk': category.pk}))
        assert response.status_code == 200
        assert response.data['name'] == "Молекулярная кухня"

    def test_search_categories(self, auth_client):
        """Поиск категорий по имени работает."""
        client, _ = auth_client
        Category.objects.create(name="Бургеры")
        Category.objects.create(name="Пицца")

        response = client.get(f"{reverse('category-list')}?search=Бургер")
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['name'] == "Бургеры"

    def test_create_category_staff_only(self, staff_client):
        """Стаф может создать категорию."""
        response = staff_client.post(reverse('category-list'), {'name': 'Веганское'})
        assert response.status_code == 201
        assert Category.objects.filter(name='Веганское').exists()

    def test_create_category_forbidden_for_regular_user(self, auth_client):
        """Обычный пользователь не может создать категорию — 403."""
        client, _ = auth_client
        response = client.post(reverse('category-list'), {'name': 'Запрещённая'})
        assert response.status_code == 403

    def test_update_category_staff_only(self, staff_client):
        """Стаф может обновить категорию."""
        category = Category.objects.create(name="Старое название")
        response = staff_client.patch(
            reverse('category-detail', kwargs={'pk': category.pk}),
            {'name': 'Новое название'},
            format='json'
        )
        assert response.status_code == 200
        category.refresh_from_db()
        assert category.name == 'Новое название'

    def test_update_category_forbidden_for_regular_user(self, auth_client):
        """Обычный пользователь не может изменить категорию — 403."""
        client, _ = auth_client
        category = Category.objects.create(name="Нетронь")
        response = client.patch(
            reverse('category-detail', kwargs={'pk': category.pk}),
            {'name': 'Взлом'},
            format='json'
        )
        assert response.status_code == 403

    def test_delete_category_staff_only(self, staff_client):
        """Стаф может удалить категорию."""
        category = Category.objects.create(name="Удалить меня")
        response = staff_client.delete(reverse('category-detail', kwargs={'pk': category.pk}))
        assert response.status_code == 204
        assert not Category.objects.filter(pk=category.pk).exists()

    def test_delete_category_forbidden_for_regular_user(self, auth_client):
        """Обычный пользователь не может удалить категорию — 403."""
        client, _ = auth_client
        category = Category.objects.create(name="Важная")
        response = client.delete(reverse('category-detail', kwargs={'pk': category.pk}))
        assert response.status_code == 403


@pytest.mark.django_db
class TestRestaurantNameNormalization:

    def test_restaurant_name_strips_whitespace(self, auth_client):
        """
        Названия ресторанов с пробелами по краям не дублируются.
        '  KFC  ' и 'KFC' должны указывать на один и тот же ресторан.
        """
        client, _ = auth_client
        url = reverse('post-list')

        burger_type_id = DishType.objects.get(name='Бургер').id
        data1 = {
            "restaurant_name": "KFC",
            "restaurant_address": "Lenina 1",
            "dish_name": "Burger",
            "dish_type_id": burger_type_id,
            "description": "Tasty",
            "rating": 8.0,
        }
        data2 = {
            "restaurant_name": "  KFC  ",
            "restaurant_address": "Lenina 1",
            "dish_name": "Chicken",
            "dish_type_id": burger_type_id,
            "description": "Good",
            "rating": 7.0,
        }

        client.post(url, data1)
        client.post(url, data2)

        assert Restaurant.objects.filter(name="KFC").count() == 1


@pytest.mark.django_db
class TestCommentsOnNonApprovedPosts:

    def test_owner_can_get_comments_on_pending_post(self, auth_client):
        """CR3-фикс: владелец поста может просматривать свои pending-посты (и их комментарии)."""
        client, user = auth_client
        restaurant = Restaurant.objects.create(name="R", address="A")
        dish = Dish.objects.create(name="d", restaurant=restaurant)
        post = Post.objects.create(user=user, dish=dish, status=Post.STATUS_PENDING)

        response = client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 200

    def test_other_user_cannot_get_comments_on_pending_post(self, auth_client, api_client):
        """Чужой pending-пост по-прежнему возвращает 404 для не-владельца."""
        _, owner = auth_client
        restaurant = Restaurant.objects.create(name="R3", address="A3")
        dish = Dish.objects.create(name="d3", restaurant=restaurant)
        post = Post.objects.create(user=owner, dish=dish, status=Post.STATUS_PENDING)

        # Создаём другого пользователя и логинимся
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(email="other@test.com", password="pwd", username="other")
        api_client.force_authenticate(user=other)
        response = api_client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 404

    def test_owner_can_get_comments_on_rejected_post(self, auth_client):
        """CR3-фикс: владелец поста может просматривать свои rejected-посты (и их комментарии)."""
        client, user = auth_client
        restaurant = Restaurant.objects.create(name="R2", address="A2")
        dish = Dish.objects.create(name="d2", restaurant=restaurant)
        post = Post.objects.create(user=user, dish=dish, status=Post.STATUS_REJECTED)

        response = client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 200
