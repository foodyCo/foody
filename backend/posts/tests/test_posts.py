import pytest
from django.urls import reverse
from posts.models import (
    Post, PostLike, PostSave, PostStatistics, PostReview,
    Restaurant, Dish, Position, Comment,
)
from posts.tasks import update_post_ratings
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
    """Каталожное блюдо: берём из засеянного каталога или создаём."""
    return Dish.objects.filter(name=name).first() or Dish.objects.create(name=name)


def make_post(user, *, restaurant=None, dish=None, position_name="Позиция",
              status=Post.STATUS_APPROVED, **kwargs):
    """Хелпер: создаёт заведение(опц.)+позицию+пост по новой схеме."""
    restaurant = restaurant or Restaurant.objects.create(name="R", address="A")
    dish = dish or get_dish()
    position, _ = Position.objects.get_or_create(
        restaurant=restaurant, name=position_name, defaults={'dish': dish}
    )
    return Post.objects.create(
        user=user, restaurant=restaurant, position=position, dish=position.dish,
        status=status, **kwargs
    )


@pytest.mark.django_db
class TestPostViews:

    def test_list_posts_pagination_and_search(self, api_client, auth_client):
        """
        Тест: Получение ленты постов (GET /api/v1/posts/) анонимным пользователем и проверка поиска.
        Проверяет: чтение без токена, структуру ответа с пагинацией, работу ?search=.
        """
        _, user = auth_client
        res = Restaurant.objects.create(name="Italiano", address="Rome")
        make_post(user, restaurant=res, dish=get_dish("Пицца"),
                  position_name="Pizza Margherita", description="Tidy", price="100.00")
        make_post(user, restaurant=res, dish=get_dish("Паста"),
                  position_name="Pasta Carbonara", description="Creamy", price="150.00")

        url = reverse('post-list')
        response = api_client.get(url)  # Without auth string
        assert response.status_code == 200
        assert 'next' in response.data
        assert len(response.data['results']) == 2

        # Поиск по названию позиции
        response = api_client.get(f"{url}?search=Pizza")
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['dish_name'] == "Pizza Margherita"
        assert 'statistics' in response.data['results'][0]

    def test_filter_by_cuisine_format_dish(self, api_client, auth_client):
        """
        Ключевая фича: пост, созданный с блюдом «Бургеры», находится по кухне
        «Американская» и формату «Фастфуд» (через привязку каталога), а также по dish_id.
        """
        _, user = auth_client
        burgers = get_dish("Бургеры")          # → Американская / Фастфуд (из сида)
        american = burgers.cuisines.get(name="Американская")
        fastfood = burgers.formats.get(name="Фастфуд")

        res = Restaurant.objects.create(name="Burger Place", address="NYC")
        make_post(user, restaurant=res, dish=burgers, position_name="Чизбургер Делюкс")
        make_post(user, restaurant=res, dish=get_dish("Паста"), position_name="Карбонара")

        url = reverse('post-list')

        r_cuisine = api_client.get(f"{url}?cuisine_id={american.id}")
        assert r_cuisine.status_code == 200
        assert len(r_cuisine.data['results']) == 1
        assert r_cuisine.data['results'][0]['dish_name'] == "Чизбургер Делюкс"

        r_format = api_client.get(f"{url}?format_id={fastfood.id}")
        assert len(r_format.data['results']) == 1
        assert r_format.data['results'][0]['dish_name'] == "Чизбургер Делюкс"

        r_dish = api_client.get(f"{url}?dish_id={burgers.id}")
        assert len(r_dish.data['results']) == 1

        # Кухни/форматы отдаются в посте (выводятся через блюдо)
        cuisines = [c['name'] for c in r_cuisine.data['results'][0]['cuisines']]
        assert "Американская" in cuisines

    def test_cursor_pagination_navigation(self, api_client, auth_client):
        _, user = auth_client
        res = Restaurant.objects.create(name="Pagination Res", address="Addr")
        for i in range(25):
            make_post(user, restaurant=res, position_name=f"Позиция {i}")

        url = reverse('post-list')
        response_page1 = api_client.get(url)
        assert response_page1.status_code == 200
        assert len(response_page1.data['results']) == 20
        assert response_page1.data['next'] is not None

        next_url = response_page1.data['next']
        response_page2 = api_client.get(next_url)
        assert response_page2.status_code == 200
        assert len(response_page2.data['results']) == 5
        assert response_page2.data['next'] is None

    def test_create_post_requires_auth(self, api_client):
        url = reverse('post-list')
        response = api_client.post(url, {
            "dish_id": 1,
            "position_name": "Test",
            "description": "Test",
            "rating": 5
        })
        assert response.status_code == 401

    def test_create_post_existing_restaurant_new_position(self, auth_client):
        """Заведение есть, позиции нет: передаём restaurant_id + dish_id + position_name."""
        client, user = auth_client
        res = Restaurant.objects.create(name="Existing Res", address="Test Addr")
        dish = get_dish("Бургеры")
        url = reverse('post-list')

        data = {
            "restaurant_id": res.id,
            "dish_id": dish.id,
            "position_name": "New Awesome Position",
            "description": "Tasty",
            "rating": 9.0,
        }
        response = client.post(url, data)
        assert response.status_code == 201

        assert Post.objects.count() == 1
        post = Post.objects.first()
        assert post.restaurant == res
        assert post.dish == dish
        assert Position.objects.filter(name="New Awesome Position", restaurant=res).exists()
        assert post.position.name == "New Awesome Position"

    def test_create_post_existing_position_dedup(self, auth_client):
        """Позиция уже есть (тот же restaurant+имя без учёта регистра/пробелов) — не дублируется."""
        client, user1 = auth_client
        res = Restaurant.objects.create(name="Old Res", address="Test Addr 2")
        dish = get_dish("Бургеры")
        Position.objects.create(restaurant=res, dish=dish, name="old position")

        url = reverse('post-list')
        data = {
            "restaurant_id": res.id,
            "dish_id": dish.id,
            "position_name": " Old Position ",  # пробелы и регистр
            "description": "Tasty",
            "rating": 9.0,
        }
        response = client.post(url, data)
        assert response.status_code == 201

        assert Position.objects.filter(restaurant=res).count() == 1
        post = Post.objects.first()
        assert post.position.name == "old position"

    def test_create_post_new_restaurant_with_geo(self, auth_client):
        """Заведения нет: создаём по имени + адрес + координаты + yandex_place_id."""
        client, user = auth_client
        dish = get_dish("Бургеры")
        url = reverse('post-list')

        data = {
            "restaurant_name": "Brand New Rest",
            "restaurant_address": "New York",
            "restaurant_lat": "40.712776",
            "restaurant_lng": "-74.005974",
            "restaurant_place_id": "yandex-123",
            "dish_id": dish.id,
            "position_name": "Fresh Burger",
            "description": "Tasty",
            "rating": 9.0,
        }
        response = client.post(url, data)
        assert response.status_code == 201

        assert Restaurant.objects.filter(name="Brand New Rest").exists()
        res = Restaurant.objects.get(name="Brand New Rest")
        assert res.address == "New York"
        assert str(res.latitude) == "40.712776"
        assert res.yandex_place_id == "yandex-123"
        assert Position.objects.filter(name="Fresh Burger", restaurant=res).exists()
        post = Post.objects.first()
        assert post.restaurant == res

    def test_create_post_missing_data(self, auth_client):
        client, _ = auth_client
        dish = get_dish("Бургеры")
        url = reverse('post-list')

        # 1. Нет ни restaurant_id, ни restaurant_name/place_id
        data1 = {"dish_id": dish.id, "position_name": "Burger", "description": "Tasty", "rating": 9.0}
        res1 = client.post(url, data1)
        assert res1.status_code == 400
        assert "restaurant" in str(res1.data)

        # 2. Нет dish_id
        res = Restaurant.objects.create(name="Res", address="Addr")
        data2 = {"restaurant_id": res.id, "position_name": "X", "description": "Tasty", "rating": 9.0}
        res2 = client.post(url, data2)
        assert res2.status_code == 400
        assert "dish_id" in res2.data

    def test_like_post_toggles(self, auth_client):
        client, user = auth_client
        post = make_post(user, position_name="Pizza")

        url = reverse('post-like', kwargs={'pk': post.id})

        response = client.post(url)
        assert response.status_code == 200
        assert response.data['liked'] is True
        assert PostLike.objects.filter(post=post, user=user).exists()

        response = client.post(url)
        assert response.status_code == 200
        assert response.data['liked'] is False
        assert not PostLike.objects.filter(post=post, user=user).exists()

    def test_post_creation_returns_tags_and_flags(self, auth_client):
        client, user = auth_client

        res_obj = Restaurant.objects.create(name="Sushi Bar", address="Tokyo")
        dish = get_dish("Суши и роллы")
        data = {
            "restaurant_id": res_obj.id,
            "dish_id": dish.id,
            "position_name": "Premium Sushi",
            "description": "Amazing",
            "price": "1000.00",
            "rating": 9.0,
            "tags_list": ["sushi", "premium", "japan"]
        }
        res_create = client.post(reverse('post-list'), data)
        assert res_create.status_code == 201
        post_id = res_create.data['id']

        Post.objects.filter(id=post_id).update(status=Post.STATUS_APPROVED)

        client.post(reverse('post-like', kwargs={'pk': post_id}))
        client.post(reverse('post-save-post', kwargs={'pk': post_id}))

        res_list = client.get(reverse('post-list'))
        assert res_list.status_code == 200
        post_in_feed = res_list.data['results'][0]

        assert len(post_in_feed['tags']) == 3
        tags_names = [t['name'] for t in post_in_feed['tags']]
        assert "sushi" in tags_names
        assert "premium" in tags_names

        assert post_in_feed['is_liked'] is True
        assert post_in_feed['is_saved'] is True

    def test_user_feed_endpoints(self, auth_client):
        client, user1 = auth_client
        user2 = User.objects.create_user(username="u2", email="u2@mail.com", password="pwd")

        res = Restaurant.objects.create(name="Food Park", address="Central")

        client2 = client.__class__()
        auth_res = client2.post(reverse('token_obtain_pair'), {"email": "u2@mail.com", "password": "pwd"})
        client2.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_res.data['access']}")

        p1 = make_post(user1, restaurant=res, position_name="P1")
        p2 = make_post(user2, restaurant=res, position_name="P2")

        client.post(reverse('post-save-post', kwargs={'pk': p2.id}))

        res_my = client.get(reverse('post-my'))
        assert res_my.status_code == 200
        assert len(res_my.data['results']) == 1
        assert res_my.data['results'][0]['id'] == p1.id

        res_saved = client.get(reverse('post-saved'))
        assert res_saved.status_code == 200
        assert len(res_saved.data['results']) == 1
        assert res_saved.data['results'][0]['id'] == p2.id

        res_user = client.get(f"{reverse('post-user-posts')}?user_id={user2.id}")
        assert res_user.status_code == 200
        assert len(res_user.data['results']) == 1
        assert res_user.data['results'][0]['id'] == p2.id

    def test_user_posts_negative(self, auth_client):
        client, user = auth_client

        res_user_missing = client.get(reverse('post-user-posts'))
        assert res_user_missing.status_code == 400
        assert "error" in res_user_missing.data

        client.logout()
        res_my_unauth = client.get(reverse('post-my'))
        assert res_my_unauth.status_code == 401

    def test_post_statistics_celery_task(self, auth_client):
        client, user1 = auth_client
        user2 = User.objects.create_user(username="u2", email="u2@mail.com", password="pwd")
        user3 = User.objects.create_user(username="u3", email="u3@mail.com", password="pwd")

        post = make_post(user1, position_name="Steak")
        PostReview.objects.create(post=post, user=user1, rating=10)
        PostReview.objects.create(post=post, user=user2, rating=6)
        PostReview.objects.create(post=post, user=user3, rating=8)

        update_post_ratings()

        stats = PostStatistics.objects.get(post=post)
        assert stats.rating == pytest.approx(8.0)

    def test_position_avg_rating_updates(self, auth_client):
        """Средняя оценка позиции пересчитывается сигналом при добавлении отзывов."""
        client, user1 = auth_client
        user2 = User.objects.create_user(username="u2", email="u2@mail.com", password="pwd")
        res = Restaurant.objects.create(name="Steak House", address="Main St")
        dish = get_dish("Стейки")

        p1 = make_post(user1, restaurant=res, dish=dish, position_name="Рибай")
        p2 = make_post(user2, restaurant=res, dish=dish, position_name="Рибай")
        assert p1.position_id == p2.position_id  # одна позиция в заведении

        PostReview.objects.create(post=p1, user=user1, rating=8)
        PostReview.objects.create(post=p2, user=user2, rating=10)

        p1.position.refresh_from_db()
        assert p1.position.avg_rating == pytest.approx(9.0)
        assert p1.position.reviews_count == 2

    def test_post_comments_endpoint(self, auth_client):
        client, user = auth_client
        post = make_post(user, position_name="Cake")

        url = reverse('post-comments', kwargs={'pk': post.id})

        res_get = client.get(url)
        assert res_get.status_code == 200
        assert len(res_get.data['results']) == 0

        res_post = client.post(url, {"text": "Very tasty!"})
        assert res_post.status_code == 201
        assert res_post.data['text'] == "Very tasty!"
        assert res_post.data['user_detail']['username'] == user.username

        res_get_after = client.get(url)
        assert len(res_get_after.data['results']) == 1
        assert res_get_after.data['results'][0]['text'] == "Very tasty!"


@pytest.mark.django_db
class TestDeleteComment:

    @pytest.fixture
    def setup(self, auth_client):
        client, user = auth_client
        post = make_post(user, position_name="D")
        PostStatistics.objects.get_or_create(post=post)
        comment = Comment.objects.create(post=post, user=user, text="My comment")
        return client, user, post, comment

    def test_author_can_delete_own_comment(self, setup):
        client, user, post, comment = setup
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': comment.pk})
        response = client.delete(url)
        assert response.status_code == 204
        assert not Comment.objects.filter(pk=comment.pk).exists()

    def test_other_user_cannot_delete_comment(self, setup):
        client, user, post, comment = setup
        other = User.objects.create_user(username="other", email="other@mail.com", password="pwd")
        other_client = APIClient()
        token = other_client.post(reverse('token_obtain_pair'), {"email": "other@mail.com", "password": "pwd"}).data['access']
        other_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': comment.pk})
        response = other_client.delete(url)
        assert response.status_code == 403
        assert Comment.objects.filter(pk=comment.pk).exists()

    def test_staff_can_delete_any_comment(self, setup):
        client, user, post, comment = setup
        staff = User.objects.create_user(username="staff2", email="staff2@mail.com", password="pwd", is_staff=True)
        staff_client = APIClient()
        token = staff_client.post(reverse('token_obtain_pair'), {"email": "staff2@mail.com", "password": "pwd"}).data['access']
        staff_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': comment.pk})
        response = staff_client.delete(url)
        assert response.status_code == 204
        assert not Comment.objects.filter(pk=comment.pk).exists()

    def test_delete_nonexistent_comment_returns_404(self, setup):
        client, user, post, comment = setup
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': 99999})
        response = client.delete(url)
        assert response.status_code == 404

    def test_unauthenticated_cannot_delete_comment(self, setup):
        _, user, post, comment = setup
        anon = APIClient()
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': comment.pk})
        response = anon.delete(url)
        assert response.status_code == 401

    def test_comments_count_decremented_after_delete(self, setup):
        client, user, post, comment = setup
        PostStatistics.objects.filter(post=post).update(comments_count=1)
        url = reverse('post-delete-comment', kwargs={'pk': post.pk, 'comment_pk': comment.pk})
        client.delete(url)
        post.statistics.refresh_from_db()
        assert post.statistics.comments_count == 0


@pytest.mark.django_db
class TestPriceFilter:

    @pytest.fixture
    def posts_with_prices(self, auth_client):
        _, user = auth_client
        res = Restaurant.objects.create(name="Price Res", address="Addr")
        prices = [100, 300, 500, 700, None]
        for i, price in enumerate(prices):
            make_post(user, restaurant=res, position_name=f"Позиция {i}", description="d", price=price)
        return auth_client

    def test_price_min(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_min=400")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(float(p) >= 400 for p in prices)
        assert len(prices) == 2

    def test_price_max(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_max=400")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(float(p) <= 400 for p in prices)
        assert len(prices) == 2

    def test_price_range(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_min=200&price_max=600")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(200 <= float(p) <= 600 for p in prices)
        assert len(prices) == 2

    def test_price_min_zero(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_min=0")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results'] if p['price'] is not None]
        assert all(float(p) >= 0 for p in prices)

    def test_no_price_filter_returns_all(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data['results']) == 5
