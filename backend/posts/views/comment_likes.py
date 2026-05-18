"""
Стандалон view для лайков на комменты — `/api/v1/comments/{id}/like/`.
Не вложен под /posts/, чтобы фронт мог дёргать одной ручкой не зная post_id.
"""
import logging

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from ..models import Comment, CommentLike

logger = logging.getLogger(__name__)


class CommentLikeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, comment_id):
        """Toggle лайка на коммент. POST = поставить, повторный POST = снять."""
        comment = get_object_or_404(Comment, id=comment_id)
        like_obj, created = CommentLike.objects.get_or_create(
            comment=comment, user=request.user
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
        try:
            ids = [int(x) for x in raw_ids.split(',') if x.strip()]
        except ValueError:
            return Response({'liked_comment_ids': []})
        if not ids:
            return Response({'liked_comment_ids': []})
        liked = CommentLike.objects.filter(
            comment_id__in=ids, user=request.user
        ).values_list('comment_id', flat=True)
        return Response({'liked_comment_ids': [str(i) for i in liked]})
