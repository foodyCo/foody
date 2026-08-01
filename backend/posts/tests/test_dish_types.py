"""Тесты справочников (кухни, категории, блюда) и авто-классификации постов.

Покрывают критерии приёмки ТЗ:
- /dish-types/ отдаёт блюда с вложенными cuisine и category
- создание поста с dish_type_id → кухня/категория выводятся автоматически, в тегах их нет
- POST без dish_type_id → 400
- фильтры ?dish_type_id / ?cuisine_id / ?category_id (и их комбинация)
- свободные теги работают отдельно от справочников
- запись в справочники — только staff
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from users.models import User
from posts.models import Post, Restaurant, Dish, Category, Cuisine, DishType


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client):
    user = User.objects.create_user(username="foodie", email="foodie@mail.com", password="pwd")
    response = api_client.post(reverse('token_obtain_pair'), {"email": "foodie@mail.com", "password": "pwd"})
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return api_client, user


@pytest.fixture
def staff_client():
    client = APIClient()
    staff = User.objects.create_user(
        username="admin1", email="admin1@mail.com", password="pwd", is_staff=True
    )
    client.force_authenticate(user=staff)
    return client, staff


def dt(name):
    return DishType.objects.get(name=name)


def make_approved_post(user, dish_type, description="test"):
    restaurant = Restaurant.objects.get_or_create(name="Тестовая", defaults={'address': 'Москва'})[0]
    dish = Dish.objects.get_or_create(name="блюдо", restaurant=restaurant)[0]
    return Post.objects.create(
        user=user, restaurant=restaurant, dish=dish, dish_type=dish_type,
        description=description, status=Post.STATUS_APPROVED,
    )


@pytest.mark.django_db
class TestReferenceBooks:

    def test_dish_types_list_has_nested_cuisine_and_category(self, api_client):
        """GET /dish-types/ доступен анониму и отдаёт вложенные cuisine/category."""
        response = api_client.get(reverse('dish-type-list'))
        assert response.status_code == 200
        results = response.data['results'] if 'results' in response.data else response.data
        by_name = {item['name']: item for item in results}
        burger = by_name['Бургер']
        assert burger['cuisine']['name'] == 'Американская'
        assert burger['category']['name'] == 'Фастфуд'
        # У «Пицца» категория намеренно пустая — null, а не отсутствие ключа
        assert by_name['Пицца']['category'] is None
        assert by_name['Пицца']['cuisine']['name'] == 'Итальянская'

    def test_cuisines_and_categories_lists_are_public(self, api_client):
        for url_name, expected in [('cuisine-list', 'Американская'), ('category-list', 'Фастфуд')]:
            response = api_client.get(reverse(url_name))
            assert response.status_code == 200
            results = response.data['results'] if 'results' in response.data else response.data
            assert expected in {item['name'] for item in results}

    def test_seeded_reference_data_complete(self):
        assert Cuisine.objects.count() >= 9
        assert Category.objects.filter(name='Другое').exists()
        assert DishType.objects.count() >= 11

    def test_regular_user_cannot_write_reference_books(self, auth_client):
        client, _ = auth_client
        for url_name in ['cuisine-list', 'category-list', 'dish-type-list']:
            response = client.post(reverse(url_name), {"name": "Хакерская"})
            assert response.status_code == 403, url_name

    def test_anon_cannot_write_reference_books(self, api_client):
        response = api_client.post(reverse('cuisine-list'), {"name": "Анонимная"})
        assert response.status_code in (401, 403)

    def test_staff_can_manage_reference_books(self, staff_client):
        client, _ = staff_client
        cuisine = client.post(reverse('cuisine-list'), {"name": "Корейская"})
        assert cuisine.status_code == 201
        category = Category.objects.get(name='Другое')
        dish_type = client.post(reverse('dish-type-list'), {
            "name": "Кимчи", "cuisine": cuisine.data['id'], "category": category.id,
        })
        assert dish_type.status_code == 201
        created = DishType.objects.get(name="Кимчи")
        assert created.cuisine.name == "Корейская"
        assert created.category.name == "Другое"


@pytest.mark.django_db
class TestPostAutoClassification:

    def _post_payload(self, dish_type_id=None, **overrides):
        payload = {
            "dish_name": "мой бургер",
            "restaurant_name": "Бургерная №1",
            "restaurant_address": "Москва",
            "description": "Очень вкусно",
            "rating": 8.5,
        }
        if dish_type_id is not None:
            payload["dish_type_id"] = dish_type_id
        payload.update(overrides)
        return payload

    def test_create_post_with_dish_type_sets_cuisine_and_category_automatically(self, auth_client):
        """Пост с блюдом «Бургер» получает кухню и категорию через справочник, теги не затронуты."""
        client, user = auth_client
        burger = dt('Бургер')
        response = client.post(
            reverse('post-list'),
            self._post_payload(dish_type_id=burger.id, tags_list=["сочно"]),
            format='json',
        )
        assert response.status_code == 201, response.data

        post = Post.objects.get(user=user)
        assert post.dish_type_id == burger.id
        # Кухня/категория выводятся через справочник — на посте отдельно не хранятся
        assert post.dish_type.cuisine.name == 'Американская'
        assert post.dish_type.category.name == 'Фастфуд'
        # В тегах нет ни кухни, ни категории — только свободные метки
        tag_names = {tag.name for tag in post.tags.all()}
        assert tag_names == {"сочно"}

    def test_create_post_without_dish_type_returns_400(self, auth_client):
        client, _ = auth_client
        response = client.post(reverse('post-list'), self._post_payload(), format='json')
        assert response.status_code == 400
        assert 'dish_type_id' in response.data
        assert Post.objects.count() == 0

    def test_create_post_with_unknown_dish_type_returns_400(self, auth_client):
        client, _ = auth_client
        response = client.post(
            reverse('post-list'), self._post_payload(dish_type_id=999999), format='json'
        )
        assert response.status_code == 400
        assert 'dish_type_id' in response.data

    def test_free_tags_work_independently_from_reference_books(self, auth_client):
        client, user = auth_client
        response = client.post(
            reverse('post-list'),
            self._post_payload(dish_type_id=dt('Рамен').id, tags_list=["остро", "азия"]),
            format='json',
        )
        assert response.status_code == 201
        post = Post.objects.get(user=user)
        assert {tag.name for tag in post.tags.all()} == {"остро", "азия"}
        # Справочники не пополнились свободными тегами
        assert not DishType.objects.filter(name__in=["остро", "азия"]).exists()


@pytest.mark.django_db
class TestClassificationFilters:

    @pytest.fixture
    def three_posts(self):
        author = User.objects.create_user(username="author", email="author@mail.com", password="pwd")
        p_burger = make_approved_post(author, dt('Бургер'), "бургер-пост")
        p_cheese = make_approved_post(author, dt('Чизбургер'), "чизбургер-пост")
        p_ramen = make_approved_post(author, dt('Рамен'), "рамен-пост")
        return p_burger, p_cheese, p_ramen

    def _ids(self, response):
        return {item['id'] for item in response.data['results']}

    def test_filter_by_category_returns_all_fastfood(self, api_client, three_posts):
        p_burger, p_cheese, p_ramen = three_posts
        fastfood = Category.objects.get(name='Фастфуд')
        response = api_client.get(reverse('post-list'), {'category_id': fastfood.id})
        assert response.status_code == 200
        assert self._ids(response) == {p_burger.id, p_cheese.id}

    def test_filter_by_cuisine_returns_all_american(self, api_client, three_posts):
        p_burger, p_cheese, p_ramen = three_posts
        american = Cuisine.objects.get(name='Американская')
        response = api_client.get(reverse('post-list'), {'cuisine_id': american.id})
        assert self._ids(response) == {p_burger.id, p_cheese.id}

    def test_filter_by_dish_type_returns_only_burger(self, api_client, three_posts):
        p_burger, _, _ = three_posts
        response = api_client.get(reverse('post-list'), {'dish_type_id': dt('Бургер').id})
        assert self._ids(response) == {p_burger.id}

    def test_filters_combine(self, api_client, three_posts):
        _, p_cheese, _ = three_posts
        response = api_client.get(reverse('post-list'), {
            'cuisine_id': Cuisine.objects.get(name='Американская').id,
            'dish_type_id': dt('Чизбургер').id,
        })
        assert self._ids(response) == {p_cheese.id}

    def test_feed_exposes_dish_type_with_nested(self, api_client, three_posts):
        response = api_client.get(reverse('post-list'), {'dish_type_id': dt('Рамен').id})
        item = response.data['results'][0]
        assert item['dish_type']['name'] == 'Рамен'
        assert item['dish_type']['cuisine']['name'] == 'Японская'
        assert item['dish_type']['category']['name'] == 'Супы'


@pytest.mark.django_db
class TestPopularDishTypes:

    def test_popular_ordering_and_limit(self, api_client):
        author = User.objects.create_user(username="pop", email="pop@mail.com", password="pwd")
        for _ in range(2):
            make_approved_post(author, dt('Бургер'))
        make_approved_post(author, dt('Рамен'))
        # pending-пост не должен влиять на популярность
        pending = make_approved_post(author, dt('Пицца'))
        pending.status = Post.STATUS_PENDING
        pending.save()

        response = api_client.get(reverse('dish-type-popular'), {'limit': 2})
        assert response.status_code == 200
        names = [item['name'] for item in response.data]
        assert len(names) == 2
        assert names[0] == 'Бургер'
        assert 'Пицца' not in names
