from rest_framework import mixins, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import Post
from ..serializers import PostListSerializer
from ..pagination import ModerationPagination


class ModerationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Эндпоинт для модераторов (staff). Список постов на модерации + одобрение/отклонение.
    Доступен только пользователям с флагом is_staff.
    """
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ModerationPagination
    serializer_class = PostListSerializer

    def get_queryset(self):
        return Post.objects.filter(
            status=Post.STATUS_PENDING
        ).select_related('user', 'statistics', 'restaurant', 'dish').prefetch_related('images', 'tags').order_by('created_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобрить пост — переводит статус в approved."""
        post = self.get_object()
        post.status = Post.STATUS_APPROVED
        post.moderated_by = request.user
        post.moderated_at = timezone.now()
        post.save(update_fields=['status', 'moderated_by', 'moderated_at'])
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить пост. Принимает опциональный rejection_reason."""
        post = self.get_object()
        post.status = Post.STATUS_REJECTED
        post.moderated_by = request.user
        post.moderated_at = timezone.now()
        post.rejection_reason = request.data.get('rejection_reason', '')
        post.save(update_fields=['status', 'moderated_by', 'moderated_at', 'rejection_reason'])
        return Response({'status': 'rejected'})
