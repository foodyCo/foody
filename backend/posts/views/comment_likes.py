"""
Стандалон view для лайков на комменты — `/api/v1/comments/{id}/like/`.
Не вложен под /posts/, чтобы фронт мог дёргать одной ручкой не зная post_id.
"""
import logging

from django.db import transaction
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from ..models import Comment, CommentLike, Post

logger = logging.getLogger(__name__)


class CommentLikeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, comment_id):
        """
        Toggle лайка на коммент. Атомарно: select_for_update берёт строку
        коммента под блокировку, чтобы параллельные POST'ы от одного юзера
        сериализовались (тот же паттерн что для PostLike в actions.py::like).
        Финальное состояние всегда совпадает с чётностью количества кликов,
        дубликатов CommentLike нет (защита и от unique_together тоже).
        """
        # 404 если коммента нет.
        try:
            comment = Comment.objects.select_related('post').get(id=comment_id)
        except Comment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Симметрично с PostLike: автор не может лайкать свои комменты на
        # своих pending/rejected постах — то же ограничение «накрутки скрытого».
        # (Если пост чужой или approved — лайк свободен.)
        if (
            comment.user_id == request.user.id
            and comment.post.user_id == request.user.id
            and comment.post.status != Post.STATUS_APPROVED
        ):
            return Response(
                {"detail": "Нельзя лайкать собственный коммент на не-одобренном посте."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            # Блок-строка по коммент-id чтобы параллельные toggle'ы стояли в очереди.
            Comment.objects.select_for_update().filter(pk=comment_id).first()
            like_obj, created = CommentLike.objects.get_or_create(
                comment_id=comment_id, user=request.user
            )
            if not created:
                like_obj.delete()
                logger.info('User %s unliked comment %s', request.user.id, comment_id)
                return Response(
                    {'liked': False, 'comment_id': comment_id},
                    status=status.HTTP_200_OK,
                )
            logger.info('User %s liked comment %s', request.user.id, comment_id)
            return Response(
                {'liked': True, 'comment_id': comment_id},
                status=status.HTTP_200_OK,
            )

    def delete(self, request, comment_id):
        """Явный DELETE — снимает лайк без toggle-семантики (для UI consistency)."""
        CommentLike.objects.filter(
            comment_id=comment_id, user=request.user
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentLikesBatchView(APIView):
    """
    GET /api/v1/comments/likes/?ids=1,2,3 — возвращает подмножество ID комментов
    из переданного списка, которые лайкнуты текущим пользователем. Используется
    фронтом в comments-sheet чтобы за один запрос получить статус лайка для
    видимого списка комментов.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        raw_ids = request.query_params.get('ids', '')
        if not raw_ids:
            return Response({'liked_comment_ids': []})
        try:
            ids = [int(x) for x in raw_ids.split(',') if x.strip()]
        except ValueError:
            return Response(
                {'detail': 'ids должны быть целыми числами через запятую.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not ids:
            return Response({'liked_comment_ids': []})
        liked = CommentLike.objects.filter(
            comment_id__in=ids, user=request.user
        ).values_list('comment_id', flat=True)
        return Response({'liked_comment_ids': [str(i) for i in liked]})
