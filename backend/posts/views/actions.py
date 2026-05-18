import logging

from django.db import transaction
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Post, PostLike, PostSave, Comment
from ..serializers import CommentSerializer

logger = logging.getLogger(__name__)

class PostActionsMixin:
    """
    Миксин для доп. действий с постами (лайки, сохранения, комментарии).
    """
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """
        Возвращает постраничный список комментариев к посту (GET) 
        или создает новый комментарий от имени текущего пользователя (POST).
        """
        post = self.get_object()
        if request.method == 'GET':
            comments_queryset = post.comments.select_related('user').all()
            page = self.paginate_queryset(comments_queryset)
            if page is not None:
                serializer = CommentSerializer(page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)
            serializer = CommentSerializer(comments_queryset, many=True, context={"request": request})
            return Response(serializer.data)
        elif request.method == 'POST':
            return self._create_comment(request, post)
            
    def _create_comment(self, request, post):
        """Хелпер для валидации и создания комментария"""
        serializer = CommentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, post=post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='comments/(?P<comment_pk>[^/.]+)',
            permission_classes=[permissions.IsAuthenticated])
    def delete_comment(self, request, pk=None, comment_pk=None):
        """
        Удаляет комментарий. Автор может удалить свой, стаф — любой.
        Сигнал on_comment_deleted атомарно уменьшит comments_count.
        """
        post = self.get_object()
        try:
            comment = Comment.objects.get(pk=comment_pk, post=post)
        except Comment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if comment.user != request.user and not request.user.is_staff:
            logger.warning('User %s tried to delete comment %s owned by %s', request.user.id, comment_pk, comment.user.id)
            return Response(status=status.HTTP_403_FORBIDDEN)

        logger.info('Comment %s on post %s deleted by user %s', comment_pk, pk, request.user.id)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """
        Toggle лайка на пост. Сначала get_object() (через queryset с фильтрами
        approved-or-own) — для не-автора чужой pending/rejected даст 404.
        Затем берём строку под select_for_update — параллельные POST'ы от
        одного юзера сериализуются и финальное состояние совпадает с
        чётностью количества кликов.

        Запрет: автор НЕ может лайкать собственный pending/rejected пост
        (накрутка скрытого контента до модерации).
        """
        post = self.get_object()  # 404 если не виден юзеру
        user = request.user

        if post.status != Post.STATUS_APPROVED and post.user_id == user.id:
            return Response(
                {"detail": "Нельзя лайкать собственный пост до одобрения модератором."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            # повторный SELECT под блокировкой по этому посту, чтобы
            # параллельный like от того же юзера дождался коммита.
            Post.objects.select_for_update().filter(pk=post.pk).first()
            like_obj, created = PostLike.objects.get_or_create(post=post, user=user)
            if not created:
                like_obj.delete()
                return Response({"liked": False}, status=status.HTTP_200_OK)
            return Response({"liked": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_post(self, request, pk=None):
        """
        Toggle закладки. Атомарно (см. like()). Сохранять можно любой
        видимый юзеру пост — даже свой pending (это персональный bookmark,
        не социальный сигнал, поэтому накрутки тут нет).
        """
        post = self.get_object()
        user = request.user
        with transaction.atomic():
            Post.objects.select_for_update().filter(pk=post.pk).first()
            save_obj, created = PostSave.objects.get_or_create(post=post, user=user)
            if not created:
                save_obj.delete()
                return Response({"saved": False}, status=status.HTTP_200_OK)
            return Response({"saved": True}, status=status.HTTP_200_OK)
