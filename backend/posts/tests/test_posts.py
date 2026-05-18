import pytest
from django.urls import reverse
from posts.models import Post, PostLike, PostSave, PostStatistics, PostReview, Restaurant, Dish, Comment
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

@pytest.mark.django_db
class TestPostViews:
    
    def test_list_posts_pagination_and_search(self, api_client, auth_client):
        """
        Тест: Получение ленты постов (GET /api/v1/posts/) анонимным пользователем и проверка поиска.
        Проверяет: Доступность на чтение без токена, базовая структура ответа с пагинацией (наличие 'next', 'results'), работу ?search=.
        """
        _, user = auth_client
        res = Restaurant.objects.create(name="Italiano", address="Rome")
        d1 = Dish.objects.create(name="Pizza Margherita", restaurant=res)
        d2 = Dish.objects.create(name="Pasta Carbonara", restaurant=res)
        
        Post.objects.create(user=user, dish=d1, description="Tidy", price="100.00", status=Post.STATUS_APPROVED)
        Post.objects.create(user=user, dish=d2, description="Creamy", price="150.00", status=Post.STATUS_APPROVED)
        
        # Получение ленты
        url = reverse('post-list')
        response = api_client.get(url)  # Without auth string
        assert response.status_code == 200
        assert 'next' in response.data # CursorPagination has 'next' instead of 'count'
        assert len(response.data['results']) == 2
        
        # Поиск по названию
        response = api_client.get(f"{url}?search=Pizza")
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['dish_name'] == "Pizza Margherita"
        assert 'statistics' in response.data['results'][0] # Check nested serializer presence

    def test_cursor_pagination_navigation(self, api_client, auth_client):
        """
        Тест: Навигация по страницам с помощью CursorPagination.
        Проверяет: Если в базе больше постов, чем page_size (20), лента корректно разбивается на страницы. Запрос по ссылке 'next' возвращает следующие посты, а не дубликаты.
        """
        _, user = auth_client
        res = Restaurant.objects.create(name="Pagination Res", address="Addr")
        # Создаем 25 постов (лимит страницы 20)
        posts = []
        for i in range(25):
            d = Dish.objects.create(name=f"Dish {i}", restaurant=res)
            posts.append(Post(user=user, dish=d, status=Post.STATUS_APPROVED))
            
        Post.objects.bulk_create(posts)
        
        url = reverse('post-list')
        
        # Страница 1
        response_page1 = api_client.get(url)
        assert response_page1.status_code == 200
        assert len(response_page1.data['results']) == 20
        assert response_page1.data['next'] is not None # Ссылка на следующую страницу обязана быть
        
        # Достаем cursor URL из ответа (DRF присылает абсолютный URL, но тест-клиенту нужен относительный запроса)
        next_url = response_page1.data['next']
        # Страница 2
        response_page2 = api_client.get(next_url)
        assert response_page2.status_code == 200
        assert len(response_page2.data['results']) == 5 # Оставшиеся 5 постов
        assert response_page2.data['next'] is None # Дальше постов нет

    def test_create_post_requires_auth(self, api_client):
        """
        Тест: Попытка создания поста анонимным пользователем.
        Проверяет: Неавторизованный POST запрос на API постов блокируется статусом 401 Unauthorized.
        """
        url = reverse('post-list')
        response = api_client.post(url, {
            "dish_name": "Test",
            "description": "Test",
            "rating": 5
        })
        assert response.status_code == 401
        
    def test_create_post_existing_restaurant_new_dish(self, auth_client):
        """
        TDD Тест 1: Ресторан есть в БД, а блюда нет.
        Передаем restaurant_id и dish_name. Должно создаться новое блюдо для этого ресторана.
        """
        client, user = auth_client
        res = Restaurant.objects.create(name="Existing Res", address="Test Addr")
        url = reverse('post-list')
        
        data = {
            "restaurant_id": res.id,
            "dish_name": "New Awesome Dish",
            "description": "Tasty",
            "rating": 9.0,
        }
        
        response = client.post(url, data)
        assert response.status_code == 201
        
        # Проверяем БД
        assert Post.objects.count() == 1
        post = Post.objects.first()
        assert post.restaurant == res
        
        # Блюдо должно появиться; CR2-фикс: имя сохраняется в исходном регистре
        assert Dish.objects.filter(name="New Awesome Dish", restaurant=res).exists()
        dish = Dish.objects.get(name="New Awesome Dish", restaurant=res)
        assert post.dish == dish

    def test_create_post_existing_restaurant_existing_dish(self, auth_client):
        """
        TDD Тест 2: Блюдо и ресторан уже есть в БД (разные юзеры об одном и том же).
        Блюдо не должно дублироваться.
        """
        client, user1 = auth_client
        res = Restaurant.objects.create(name="Old Res", address="Test Addr 2")
        Dish.objects.create(name="old dish", restaurant=res)
        
        url = reverse('post-list')
        data = {
            "restaurant_id": res.id,
            "dish_name": " Old Dish ", # Специально с пробелами и разным регистром
            "description": "Tasty",
            "rating": 9.0,
        }
        
        response = client.post(url, data)
        assert response.status_code == 201
        
        # Проверяем БД на дубликаты блюд
        assert Dish.objects.filter(name="old dish").count() == 1
        post = Post.objects.first()
        assert post.dish.name == "old dish"

    def test_create_post_new_restaurant_and_dish(self, auth_client):
        """
        TDD Тест 3: Ресторана нет в БД, блюда нет.
        Передаем имена ресторана, адреса и блюда.
        """
        client, user = auth_client
        url = reverse('post-list')
        
        data = {
            "restaurant_name": "Brand New Rest",
            "restaurant_address": "New York",
            "dish_name": "Fresh Burger",
            "description": "Tasty",
            "rating": 9.0,
        }
        
        response = client.post(url, data)
        assert response.status_code == 201
        
        # Проверяем, что ресторан и блюдо создались
        assert Restaurant.objects.filter(name="Brand New Rest").exists()
        res = Restaurant.objects.get(name="Brand New Rest")
        assert res.address == "New York"
        
        # CR2-фикс: имя сохраняется в исходном регистре
        assert Dish.objects.filter(name="Fresh Burger", restaurant=res).exists()
        
        post = Post.objects.first()
        assert post.restaurant == res

    def test_create_post_missing_data(self, auth_client):
        """
        TDD Тест 4: Отправка без ресторана или без блюда (400)
        """
        client, _ = auth_client
        url = reverse('post-list')
        
        # 1. Нет ни restaurant_id, ни restaurant_name
        data1 = {
            "dish_name": "Burger",
            "description": "Tasty", "rating": 9.0
        }
        res1 = client.post(url, data1)
        assert res1.status_code == 400
        assert "restaurant" in str(res1.data)

        # 2. Нет dish_name
        res = Restaurant.objects.create(name="Res", address="Addr")
        data2 = {
            "restaurant_id": res.id,
            "description": "Tasty", "rating": 9.0
        }
        res2 = client.post(url, data2)
        assert res2.status_code == 400
        assert "dish_name" in res2.data
        
    def test_like_post_toggles(self, auth_client):
        """
        Тест: Работа механизма лайков (Toggle-режим: добавить/убрать лайк одним endpoint'ом).
        Проверяет: Первый вызов POST-запроса создает лайк (liked: True), повторный вызов удаляет его (liked: False).
        """
        client, user = auth_client
        res = Restaurant.objects.create(name="Test Res", address="Test Addr")
        dish = Dish.objects.create(name="Pizza", restaurant=res)
        post = Post.objects.create(user=user, dish=dish, description="Tidy", status=Post.STATUS_APPROVED)

        url = reverse('post-like', kwargs={'pk': post.id})
        
        # Ставим лайк
        response = client.post(url)
        assert response.status_code == 200
        assert response.data['liked'] is True
        assert PostLike.objects.filter(post=post, user=user).exists()
        
        # Убираем лайк (Toggle)
        response = client.post(url)
        assert response.status_code == 200
        assert response.data['liked'] is False
        assert not PostLike.objects.filter(post=post, user=user).exists()

    def test_post_creation_returns_tags_and_flags(self, auth_client):
        """
        Тест: Интеграционная проверка получения собственных постов со связями.
        Проверяет: Пост, который мы создали, лайкнули и сохранили, будет возвращаться в ленте 
        со сгенерированными тегами массивом, а флаги is_liked и is_saved будут True.
        """
        client, user = auth_client
        
        # 1. Создаем пост с тегами
        res_obj = Restaurant.objects.create(name="Sushi Bar", address="Tokyo")
        dish_obj = Dish.objects.create(name="Premium Sushi", restaurant=res_obj)
        data = {
            "restaurant_id": res_obj.id,
            "dish_name": dish_obj.name,
            "description": "Amazing",
            "price": "1000.00",
            "rating": 9.0,
            "tags_list": ["sushi", "premium", "japan"]
        }
        res_create = client.post(reverse('post-list'), data)
        assert res_create.status_code == 201
        post_id = res_create.data['id']

        # Одобряем пост вручную (обходим модерацию в тесте)
        Post.objects.filter(id=post_id).update(status=Post.STATUS_APPROVED)

        # 2. Ставим лайк и сохраняем в избранное
        client.post(reverse('post-like', kwargs={'pk': post_id}))
        client.post(reverse('post-save-post', kwargs={'pk': post_id}))

        # 3. Запрашиваем ленту
        res_list = client.get(reverse('post-list'))
        assert res_list.status_code == 200

        post_in_feed = res_list.data['results'][0]
        
        # 4. Проверяем теги
        assert len(post_in_feed['tags']) == 3
        tags_names = [t['name'] for t in post_in_feed['tags']]
        assert "sushi" in tags_names
        assert "premium" in tags_names
        
        # 5. Проверяем флаги
        assert post_in_feed['is_liked'] is True
        assert post_in_feed['is_saved'] is True
        
    def test_user_feed_endpoints(self, auth_client):
        """
        Тест: Кастомные экшены ленты (/my/, /saved/, /user_posts/).
        Проверяет: Каждый экшен возвращает правильную выборку (только свои посты, 
        только сохраненные посты, посты конкретного пользователя), и использует CursorPagination.
        """
        client, user1 = auth_client
        user2 = User.objects.create_user(username="u2", email="u2@mail.com", password="pwd")

        res = Restaurant.objects.create(name="Food Park", address="Central")
        d1 = Dish.objects.create(name="P1", restaurant=res)
        d2 = Dish.objects.create(name="P2", restaurant=res)

        client2 = client.__class__()
        auth_res = client2.post(reverse('token_obtain_pair'), {"email": "u2@mail.com", "password": "pwd"})
        client2.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_res.data['access']}")
        
        p1 = Post.objects.create(user=user1, dish=d1, status=Post.STATUS_APPROVED)
        p2 = Post.objects.create(user=user2, dish=d2, status=Post.STATUS_APPROVED)
        
        # user1 saves p2
        client.post(reverse('post-save-post', kwargs={'pk': p2.id}))
        
        # 1. /my/
        res_my = client.get(reverse('post-my'))
        assert res_my.status_code == 200
        assert len(res_my.data['results']) == 1  # Теперь с пагинацией
        assert res_my.data['results'][0]['id'] == p1.id
        
        # 2. /saved/
        res_saved = client.get(reverse('post-saved'))
        assert res_saved.status_code == 200
        assert len(res_saved.data['results']) == 1 # Теперь с пагинацией
        assert res_saved.data['results'][0]['id'] == p2.id
        
        # 3. /user_posts/?user_id=
        res_user = client.get(f"{reverse('post-user-posts')}?user_id={user2.id}")
        assert res_user.status_code == 200
        assert len(res_user.data['results']) == 1 # Теперь с пагинацией
        assert res_user.data['results'][0]['id'] == p2.id

    def test_user_posts_negative(self, auth_client):
        """
        Тест: Ошибочные и нежелательные сценарии для профильных лент.
        Проверяет: Вызов /user_posts/ без обязательного ?user_id_ возвращает 400 Bad Request. 
        Обращение к /my/ без авторизации возвращает 401.
        """
        client, user = auth_client
        
        # Без параметра user_id
        res_user_missing = client.get(reverse('post-user-posts'))
        assert res_user_missing.status_code == 400
        assert "error" in res_user_missing.data
        
        # Без авторизации на my_posts
        client.logout()
        res_my_unauth = client.get(reverse('post-my'))
        assert res_my_unauth.status_code == 401

    def test_post_statistics_celery_task(self, auth_client):
        """
        Тест: Асинхронное обновление рейтинга поста.
        Проверяет: Работу логики суммирования оценок вкуса, внешнего вида и сытности от отзывов разных пользователей
        и сохранения финальных средних значений в модель PostStatistics.
        """
        client, user1 = auth_client
        
        user2 = User.objects.create_user(username="u2", email="u2@mail.com", password="pwd")
        user3 = User.objects.create_user(username="u3", email="u3@mail.com", password="pwd")
        
        res = Restaurant.objects.create(name="Steak House", address="Main St")
        dish = Dish.objects.create(name="Steak", restaurant=res)
        post = Post.objects.create(user=user1, dish=dish, description="Juicy", status=Post.STATUS_APPROVED)
        # Initialize stats, this usually happens on post creation implicitly if we use the API, but here we bypassed it.
        # So we manually create the reviews to mimic API behavior:
        PostReview.objects.create(post=post, user=user1, rating=10)
        PostReview.objects.create(post=post, user=user2, rating=6)
        PostReview.objects.create(post=post, user=user3, rating=8)

        # Вызываем Celery задачу напрямую
        update_post_ratings()

        stats = PostStatistics.objects.get(post=post)
        # (10 + 6 + 8) / 3 = 8.0
        assert stats.rating == pytest.approx(8.0)

    def test_post_comments_endpoint(self, auth_client):
        """
        Тест: Endpoint добавления и чтения комментариев (/api/v1/posts/<id>/comments/).
        Проверяет: GET пустой список, POST создает коммент с привязкой к юзеру и посту, 
        последующий GET возвращает пагинированный массив с созданным комментарием.
        """
        client, user = auth_client
        res = Restaurant.objects.create(name="Bakery", address="Corner")
        dish = Dish.objects.create(name="Cake", restaurant=res)
        post = Post.objects.create(user=user, dish=dish, status=Post.STATUS_APPROVED)
        
        url = reverse('post-comments', kwargs={'pk': post.id})
        
        # Чтение (пустой список)
        res_get = client.get(url)
        assert res_get.status_code == 200
        assert len(res_get.data['results']) == 0
        
        # Создание комментария
        res_post = client.post(url, {"text": "Very tasty!"})
        assert res_post.status_code == 201
        assert res_post.data['text'] == "Very tasty!"
        assert res_post.data['user_detail']['username'] == user.username
        
        # Чтение (1 комментарий)
        res_get_after = client.get(url)
        assert len(res_get_after.data['results']) == 1
        assert res_get_after.data['results'][0]['text'] == "Very tasty!"


@pytest.mark.django_db
class TestDeleteComment:

    @pytest.fixture
    def setup(self, auth_client):
        client, user = auth_client
        res = Restaurant.objects.create(name="R", address="A")
        dish = Dish.objects.create(name="D", restaurant=res)
        post = Post.objects.create(user=user, dish=dish, status=Post.STATUS_APPROVED)
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
        """После удаления комментария сигнал уменьшает comments_count."""
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
            dish = Dish.objects.create(name=f"Dish {i}", restaurant=res)
            Post.objects.create(user=user, dish=dish, description="d", price=price, status=Post.STATUS_APPROVED)
        return auth_client

    def test_price_min(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_min=400")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(float(p) >= 400 for p in prices)
        assert len(prices) == 2  # 500, 700

    def test_price_max(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_max=400")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(float(p) <= 400 for p in prices)
        assert len(prices) == 2  # 100, 300

    def test_price_range(self, api_client, posts_with_prices):
        url = reverse('post-list')
        response = api_client.get(f"{url}?price_min=200&price_max=600")
        assert response.status_code == 200
        prices = [p['price'] for p in response.data['results']]
        assert all(200 <= float(p) <= 600 for p in prices)
        assert len(prices) == 2  # 300, 500

    def test_price_min_zero(self, api_client, posts_with_prices):
        """price_min=0 не должен фильтровать — 0 это валидное значение."""
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
