import pytest
from django.urls import reverse
from posts.models import Post, Restaurant, Dish
from users.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(username="user", email="user@mail.com", password="pwd")


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(username="staff", email="staff@mail.com", password="pwd", is_staff=True)


@pytest.fixture
def auth_client(api_client, regular_user):
    response = api_client.post(reverse('token_obtain_pair'), {"email": "user@mail.com", "password": "pwd"})
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    response = api_client.post(reverse('token_obtain_pair'), {"email": "staff@mail.com", "password": "pwd"})
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
    return api_client


def create_post(user, post_status=Post.STATUS_PENDING, with_restaurant=False):
    """Создаёт пост с опциональным рестораном и блюдом."""
    restaurant = None
    dish = None
    if with_restaurant:
        restaurant, _ = Restaurant.objects.get_or_create(name="Test Restaurant", defaults={'address': 'Test Addr'})
        dish, _ = Dish.objects.get_or_create(name="test dish", restaurant=restaurant)
    return Post.objects.create(
        user=user,
        description="test description",
        price="250.00",
        status=post_status,
        restaurant=restaurant,
        dish=dish,
    )


@pytest.mark.django_db
class TestModerationFeedFilter:

    def test_pending_post_not_visible_in_feed(self, auth_client, regular_user):
        """Обычный юзер не видит чужие pending посты в ленте."""
        other_user = User.objects.create_user(username="other", email="other@mail.com", password="pwd")
        create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.get(reverse('post-list'))
        assert response.status_code == 200
        assert response.data['results'] == []

    def test_rejected_post_not_visible_in_feed(self, auth_client, regular_user):
        """Обычный юзер не видит чужие rejected посты в ленте."""
        other_user = User.objects.create_user(username="other", email="other@mail.com", password="pwd")
        create_post(other_user, post_status=Post.STATUS_REJECTED)

        response = auth_client.get(reverse('post-list'))
        assert response.status_code == 200
        assert response.data['results'] == []

    def test_approved_post_visible_in_feed(self, auth_client):
        """Одобренные посты видны в ленте."""
        other_user = User.objects.create_user(username="other2", email="other2@mail.com", password="pwd")
        create_post(other_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.get(reverse('post-list'))
        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_author_sees_own_pending_and_rejected_in_my_posts(self, auth_client, regular_user):
        """Автор видит свои pending и rejected посты в /my/."""
        create_post(regular_user, post_status=Post.STATUS_PENDING)
        create_post(regular_user, post_status=Post.STATUS_REJECTED)
        create_post(regular_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.get(reverse('post-my'))
        assert response.status_code == 200
        assert len(response.data['results']) == 3

    def test_author_sees_status_field(self, auth_client, regular_user):
        """Автор видит корректное поле status в ответе."""
        create_post(regular_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.get(reverse('post-my'))
        assert response.status_code == 200
        assert response.data['results'][0]['status'] == Post.STATUS_APPROVED

    def test_rejected_post_returns_fields_needed_for_resubmit(self, auth_client, regular_user):
        """
        Реджектнутый пост должен возвращать все поля, необходимые для повторной отправки на модерацию:
        description, price, status, restaurant, dish_name, tags — чтобы фронт мог pre-fill форму.
        """
        create_post(regular_user, post_status=Post.STATUS_REJECTED, with_restaurant=True)

        response = auth_client.get(reverse('post-my'))
        assert response.status_code == 200
        post_data = response.data['results'][0]

        assert post_data['status'] == Post.STATUS_REJECTED
        # Поля для повторной отправки
        assert 'description' in post_data
        assert 'price' in post_data
        assert 'dish_name' in post_data
        assert 'restaurant' in post_data
        assert 'tags' in post_data
        assert 'images' in post_data
        # Конкретные значения
        assert post_data['description'] == "test description"
        assert post_data['dish_name'] == "test dish"

    def test_status_field_visible_to_everyone(self, auth_client):
        """Поле status доступно всем — незнакомые юзеры всё равно видят только approved посты."""
        other_user = User.objects.create_user(username="other3", email="other3@mail.com", password="pwd")
        create_post(other_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.get(reverse('post-list'))
        assert response.status_code == 200
        assert response.data['results'][0]['status'] == Post.STATUS_APPROVED


@pytest.mark.django_db
class TestModerationEndpoint:

    def test_regular_user_gets_403(self, auth_client):
        """Обычный юзер получает 403 на /moderation/."""
        response = auth_client.get(reverse('moderation-list'))
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, api_client):
        """Неавторизованный пользователь получает 401 на /moderation/."""
        response = api_client.get(reverse('moderation-list'))
        assert response.status_code == 401

    def test_staff_sees_only_pending_posts(self, staff_client, staff_user):
        """Стаф видит список pending постов — approved и rejected не включены."""
        author = User.objects.create_user(username="author", email="author@mail.com", password="pwd")
        create_post(author, post_status=Post.STATUS_PENDING)
        create_post(author, post_status=Post.STATUS_APPROVED)
        create_post(author, post_status=Post.STATUS_REJECTED)

        response = staff_client.get(reverse('moderation-list'))
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == Post.STATUS_PENDING

    def test_staff_approves_post(self, staff_client, staff_user):
        """Стаф одобряет пост — он появляется в ленте, moderated_by и moderated_at проставлены."""
        author = User.objects.create_user(username="author2", email="author2@mail.com", password="pwd")
        post = create_post(author, post_status=Post.STATUS_PENDING)

        response = staff_client.post(reverse('moderation-approve', kwargs={'pk': post.pk}))
        assert response.status_code == 200
        assert response.data['status'] == 'approved'

        post.refresh_from_db()
        assert post.status == Post.STATUS_APPROVED
        assert post.moderated_by == staff_user
        assert post.moderated_at is not None

    def test_approved_post_appears_in_feed(self, staff_client, staff_user):
        """После одобрения пост появляется в публичной ленте (проверяем анонимным клиентом)."""
        author = User.objects.create_user(username="author_feed", email="author_feed@mail.com", password="pwd")
        post = create_post(author, post_status=Post.STATUS_PENDING)
        anon_client = APIClient()

        # До одобрения — поста нет в ленте
        response = anon_client.get(reverse('post-list'))
        assert len(response.data['results']) == 0

        staff_client.post(reverse('moderation-approve', kwargs={'pk': post.pk}))

        # После одобрения — пост появился
        response = anon_client.get(reverse('post-list'))
        assert len(response.data['results']) == 1

    def test_staff_rejects_post(self, staff_client, staff_user):
        """Стаф отклоняет пост — статус rejected, moderated_by проставлен."""
        author = User.objects.create_user(username="author3", email="author3@mail.com", password="pwd")
        post = create_post(author, post_status=Post.STATUS_PENDING)

        response = staff_client.post(reverse('moderation-reject', kwargs={'pk': post.pk}))
        assert response.status_code == 200
        assert response.data['status'] == 'rejected'

        post.refresh_from_db()
        assert post.status == Post.STATUS_REJECTED
        assert post.moderated_by == staff_user
        assert post.moderated_at is not None

    def test_rejected_post_not_in_feed(self, staff_client, auth_client):
        """Отклонённый пост не появляется в публичной ленте."""
        author = User.objects.create_user(username="author_rej", email="author_rej@mail.com", password="pwd")
        post = create_post(author, post_status=Post.STATUS_PENDING)

        staff_client.post(reverse('moderation-reject', kwargs={'pk': post.pk}))

        response = auth_client.get(reverse('post-list'))
        assert len(response.data['results']) == 0

    def test_rejected_post_visible_to_author_in_my_posts(self, staff_client, api_client, staff_user):
        """Отклонённый пост виден только автору в /my/."""
        author = User.objects.create_user(username="author_vis", email="author_vis@mail.com", password="pwd")
        post = create_post(author, post_status=Post.STATUS_PENDING)

        staff_client.post(reverse('moderation-reject', kwargs={'pk': post.pk}))

        # Авторизуемся как автор
        response = api_client.post(reverse('token_obtain_pair'), {"email": "author_vis@mail.com", "password": "pwd"})
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')

        response = api_client.get(reverse('post-my'))
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == Post.STATUS_REJECTED

    def test_moderation_pagination(self, staff_client):
        """Пагинация: по умолчанию 10 постов на странице."""
        author = User.objects.create_user(username="pauthor", email="pauthor@mail.com", password="pwd")
        for i in range(15):
            create_post(author, post_status=Post.STATUS_PENDING)

        response = staff_client.get(reverse('moderation-list'))
        assert response.status_code == 200
        assert len(response.data['results']) == 10
        assert response.data['count'] == 15


@pytest.mark.django_db
class TestPostDelete:

    def test_author_can_delete_pending_post(self, auth_client, regular_user):
        """Автор может удалить свой pending пост."""
        post = create_post(regular_user, post_status=Post.STATUS_PENDING)

        response = auth_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 204
        assert not Post.objects.filter(pk=post.pk).exists()

    def test_author_can_delete_rejected_post(self, auth_client, regular_user):
        """Автор может удалить свой rejected пост."""
        post = create_post(regular_user, post_status=Post.STATUS_REJECTED)

        response = auth_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 204
        assert not Post.objects.filter(pk=post.pk).exists()

    def test_author_can_delete_approved_post(self, auth_client, regular_user):
        """Автор может удалить одобренный пост."""
        post = create_post(regular_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 204
        assert not Post.objects.filter(pk=post.pk).exists()

    def test_staff_can_delete_any_post(self, staff_client, staff_user):
        """Стаф может удалить любой чужой пост."""
        other_user = User.objects.create_user(username="victim", email="victim@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_APPROVED)

        response = staff_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 204
        assert not Post.objects.filter(pk=post.pk).exists()

    def test_non_author_cannot_delete_post(self, auth_client):
        """Чужой пост нельзя удалить — 403."""
        other_user = User.objects.create_user(username="other_del", email="other_del@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 403

    def test_unauthenticated_cannot_delete_post(self, api_client):
        """Неавторизованный пользователь не может удалить пост — 401."""
        user = User.objects.create_user(username="owner_del", email="owner_del@mail.com", password="pwd")
        post = create_post(user, post_status=Post.STATUS_PENDING)

        response = api_client.delete(reverse('post-detail', kwargs={'pk': post.pk}))
        assert response.status_code == 401


@pytest.mark.django_db
class TestPostEdit:

    def test_author_can_edit_rejected_post(self, auth_client, regular_user):
        """Автор может отредактировать rejected пост — статус сбрасывается в pending."""
        post = create_post(regular_user, post_status=Post.STATUS_REJECTED)

        response = auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Обновлённое описание'},
            format='json'
        )
        assert response.status_code == 200

        post.refresh_from_db()
        assert post.description == 'Обновлённое описание'
        assert post.status == Post.STATUS_PENDING

    def test_author_can_edit_pending_post(self, auth_client, regular_user):
        """Автор может отредактировать pending пост — статус остаётся pending."""
        post = create_post(regular_user, post_status=Post.STATUS_PENDING)

        response = auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Новое описание'},
            format='json'
        )
        assert response.status_code == 200

        post.refresh_from_db()
        assert post.description == 'Новое описание'
        assert post.status == Post.STATUS_PENDING

    def test_author_can_edit_approved_post_resets_to_pending(self, auth_client, regular_user):
        """Автор может редактировать одобренный пост — статус сбрасывается в pending."""
        post = create_post(regular_user, post_status=Post.STATUS_APPROVED)

        response = auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Обновлённое описание'},
            format='json'
        )
        assert response.status_code == 200

        post.refresh_from_db()
        assert post.description == 'Обновлённое описание'
        assert post.status == Post.STATUS_PENDING

    def test_edit_rejected_post_goes_back_to_pending_queue(self, auth_client, regular_user):
        """После редактирования rejected поста он снова попадает в очередь на модерацию."""
        post = create_post(regular_user, post_status=Post.STATUS_REJECTED)

        auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Исправленный пост'},
            format='json'
        )

        post.refresh_from_db()
        assert post.status == Post.STATUS_PENDING

        # Пост снова в очереди модерации
        assert Post.objects.filter(status=Post.STATUS_PENDING).count() == 1

    def test_edit_clears_moderation_fields(self, auth_client, regular_user):
        """После редактирования moderated_by и moderated_at очищаются."""
        staff = User.objects.create_user(username="staff_clear", email="staff_clear@mail.com", password="pwd", is_staff=True)
        post = create_post(regular_user, post_status=Post.STATUS_REJECTED)
        # Имитируем что пост уже был промодерирован
        from django.utils import timezone
        post.moderated_by = staff
        post.moderated_at = timezone.now()
        post.save()

        auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Исправлено'},
            format='json'
        )

        post.refresh_from_db()
        assert post.moderated_by is None
        assert post.moderated_at is None

    def test_non_author_cannot_edit_post(self, auth_client):
        """Чужой пост нельзя редактировать — 404 (queryset фильтрует по user)."""
        other_user = User.objects.create_user(username="other_edit", email="other_edit@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.patch(
            reverse('post-detail', kwargs={'pk': post.pk}),
            {'description': 'Попытка взлома'},
            format='json'
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestStatisticsIsolation:

    def test_cannot_like_pending_post(self, auth_client, regular_user):
        """Нельзя поставить лайк pending посту — 404."""
        other_user = User.objects.create_user(username="liker", email="liker@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.post(reverse('post-like', kwargs={'pk': post.pk}))
        assert response.status_code == 404

    def test_cannot_like_rejected_post(self, auth_client, regular_user):
        """Нельзя поставить лайк rejected посту — 404."""
        other_user = User.objects.create_user(username="liker2", email="liker2@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_REJECTED)

        response = auth_client.post(reverse('post-like', kwargs={'pk': post.pk}))
        assert response.status_code == 404

    def test_cannot_save_pending_post(self, auth_client, regular_user):
        """Нельзя сохранить pending пост — 404."""
        other_user = User.objects.create_user(username="saver", email="saver@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.post(reverse('post-save-post', kwargs={'pk': post.pk}))
        assert response.status_code == 404

    def test_cannot_comment_pending_post(self, auth_client, regular_user):
        """Нельзя прокомментировать pending пост — 404."""
        other_user = User.objects.create_user(username="commenter", email="commenter@mail.com", password="pwd")
        post = create_post(other_user, post_status=Post.STATUS_PENDING)

        response = auth_client.post(
            reverse('post-comments', kwargs={'pk': post.pk}),
            {'text': 'Отличный пост!'},
            format='json'
        )
        assert response.status_code == 404
