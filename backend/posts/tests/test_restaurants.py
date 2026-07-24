import pytest
from django.urls import reverse
from posts.models import Restaurant, Dish, Cuisine, Format, Position, Post
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


def get_dish(name="Бургеры"):
    return Dish.objects.filter(name=name).first() or Dish.objects.create(name=name)


def make_post(user, *, restaurant, dish=None, position_name="Позиция", status=Post.STATUS_APPROVED):
    dish = dish or get_dish()
    position, _ = Position.objects.get_or_create(
        restaurant=restaurant, name=position_name, defaults={'dish': dish}
    )
    return Post.objects.create(
        user=user, restaurant=restaurant, position=position, dish=position.dish, status=status
    )


@pytest.mark.django_db
class TestRestaurantsViews:

    def test_restaurant_search(self, auth_client):
        """Поиск заведения по названию + координаты в ответе."""
        client, _ = auth_client
        Restaurant.objects.create(name="McDonalds", address="Lenina 1", latitude="55.75", longitude="37.61")
        Restaurant.objects.create(name="KFC", address="Lenina 2")

        url = reverse('restaurant-list')

        res_all = client.get(url)
        assert res_all.status_code == 200
        assert len(res_all.data['results']) == 2

        res_search = client.get(f"{url}?search=McDonalds")
        assert res_search.status_code == 200
        assert len(res_search.data['results']) == 1
        assert res_search.data['results'][0]['name'] == "McDonalds"
        assert res_search.data['results'][0]['latitude'] == "55.750000"

    def test_positions_by_restaurant(self, auth_client):
        """Список позиций конкретного заведения (заменяет старое /dishes/?restaurant_id=)."""
        client, _ = auth_client
        r1 = Restaurant.objects.create(name="R1", address="A1")
        r2 = Restaurant.objects.create(name="R2", address="A2")
        burgers = get_dish("Бургеры")
        Position.objects.create(name="Pizza", restaurant=r1, dish=burgers)
        Position.objects.create(name="Pasta", restaurant=r1, dish=burgers)
        Position.objects.create(name="Sushi", restaurant=r2, dish=burgers)

        url = reverse('position-list')

        res_r1 = client.get(f"{url}?restaurant_id={r1.id}")
        assert res_r1.status_code == 200
        assert len(res_r1.data['results']) == 2

        res_r1_search = client.get(f"{url}?restaurant_id={r1.id}&search=Pizza")
        assert res_r1_search.status_code == 200
        assert len(res_r1_search.data['results']) == 1
        assert res_r1_search.data['results'][0]['name'] == "Pizza"


@pytest.mark.django_db
class TestCatalogViews:
    """Справочники каталога: кухни/форматы/блюда (только чтение, публичные)."""

    def test_list_cuisines_public(self, api_client):
        # Каталог засеян миграцией 0002 (12 кухонь)
        response = api_client.get(reverse('cuisine-list'))
        assert response.status_code == 200
        assert len(response.data) >= 12
        assert any(c['name'] == "Американская" for c in response.data)

    def test_list_formats_public(self, api_client):
        response = api_client.get(reverse('format-list'))
        assert response.status_code == 200
        assert any(f['name'] == "Фастфуд" for f in response.data)

    def test_list_dishes_with_mapping(self, api_client):
        response = api_client.get(reverse('dish-list'))
        assert response.status_code == 200
        burgers = next(d for d in response.data if d['name'] == "Бургеры")
        cuisine_names = [c['name'] for c in burgers['cuisines']]
        format_names = [f['name'] for f in burgers['formats']]
        assert "Американская" in cuisine_names
        assert "Фастфуд" in format_names

    def test_dishes_popular(self, api_client):
        response = api_client.get(reverse('dish-popular'))
        assert response.status_code == 200
        assert all(d['is_popular'] for d in response.data)

    def test_cuisines_popular(self, api_client):
        response = api_client.get(reverse('cuisine-popular'))
        assert response.status_code == 200
        assert all(c['is_popular'] for c in response.data)

    def test_search_dishes(self, api_client):
        response = api_client.get(f"{reverse('dish-list')}?search=Бургер")
        assert response.status_code == 200
        assert any(d['name'] == "Бургеры" for d in response.data)


@pytest.mark.django_db
class TestRestaurantNameNormalization:

    def test_restaurant_name_strips_whitespace(self, auth_client):
        """'  KFC  ' и 'KFC' с тем же адресом указывают на одно заведение."""
        client, _ = auth_client
        dish = get_dish("Бургеры")
        url = reverse('post-list')

        data1 = {
            "restaurant_name": "KFC",
            "restaurant_address": "Lenina 1",
            "dish_id": dish.id,
            "position_name": "Burger",
            "description": "Tasty",
            "rating": 8.0,
        }
        data2 = {
            "restaurant_name": "  KFC  ",
            "restaurant_address": "Lenina 1",
            "dish_id": dish.id,
            "position_name": "Chicken",
            "description": "Good",
            "rating": 7.0,
        }

        client.post(url, data1)
        client.post(url, data2)

        assert Restaurant.objects.filter(name="KFC").count() == 1


@pytest.mark.django_db
class TestCommentsOnNonApprovedPosts:

    def test_owner_can_get_comments_on_pending_post(self, auth_client):
        client, user = auth_client
        restaurant = Restaurant.objects.create(name="R", address="A")
        post = make_post(user, restaurant=restaurant, position_name="d", status=Post.STATUS_PENDING)

        response = client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 200

    def test_other_user_cannot_get_comments_on_pending_post(self, auth_client, api_client):
        _, owner = auth_client
        restaurant = Restaurant.objects.create(name="R3", address="A3")
        post = make_post(owner, restaurant=restaurant, position_name="d3", status=Post.STATUS_PENDING)

        other = User.objects.create_user(email="other@test.com", password="pwd", username="other")
        api_client.force_authenticate(user=other)
        response = api_client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 404

    def test_owner_can_get_comments_on_rejected_post(self, auth_client):
        client, user = auth_client
        restaurant = Restaurant.objects.create(name="R2", address="A2")
        post = make_post(user, restaurant=restaurant, position_name="d2", status=Post.STATUS_REJECTED)

        response = client.get(reverse('post-comments', kwargs={'pk': post.pk}))
        assert response.status_code == 200
