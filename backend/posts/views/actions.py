from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import PostLike, PostSave, Comment
from ..serializers import CommentSerializer

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
                serializer = CommentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = CommentSerializer(comments_queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            return self._create_comment(request, post)
            
    def _create_comment(self, request, post):
        """Хелпер для валидации и создания комментария"""
        serializer = CommentSerializer(data=request.data)
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
            return Response(status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """
        Создает лайк для поста (если его нет) или удаляет его (если он уже есть).
        Атомарное добавление/удаление счетчиков происходит через сигналы.
        """
        post = self.get_object()
        user = request.user
        like_obj, created = PostLike.objects.get_or_create(post=post, user=user)
        
        if not created:
            like_obj.delete()
            return Response({"liked": False}, status=status.HTTP_200_OK)
            
        return Response({"liked": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save_post(self, request, pk=None):
        """
        Добавляет пост в закладки пользователя (если его нет) или удаляет из закладок.
        Атомарное добавление/удаление счетчиков происходит через сигналы.
        """
        post = self.get_object()
        user = request.user
        save_obj, created = PostSave.objects.get_or_create(post=post, user=user)
        
        if not created:
            save_obj.delete()
            return Response({"saved": False}, status=status.HTTP_200_OK)
            
        return Response({"saved": True}, status=status.HTTP_200_OK)
