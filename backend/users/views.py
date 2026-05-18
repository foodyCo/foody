import logging

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import F
from .models import User, Follow
from .serializers import UserRegistrationSerializer, UserSerializer

logger = logging.getLogger(__name__)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error('Profile update failed for user %s: %s', request.user.id, serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        DELETE /api/v1/users/me/ — самоудаление аккаунта.

        Все связанные посты/комменты/лайки/подписки удалятся каскадно благодаря
        on_delete=CASCADE / SET_NULL в моделях. JWT остаётся валидным до своего
        expiry — фронт обязан очистить cookie сессии сразу после 204.
        """
        user = request.user
        user_id = user.id
        user.delete()
        logger.info('User %s deleted their account', user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticatedOrReadOnly,)
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'


class SubscribeView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        if target == request.user:
            logger.warning('User %s tried to follow themselves', request.user.id)
            return Response({'error': 'Нельзя подписаться на себя'}, status=status.HTTP_400_BAD_REQUEST)
        _, created = Follow.objects.get_or_create(follower=request.user, following=target)
        if created:
            # Counters updated via post_save signal in users/signals.py
            logger.info('User %s followed user %s', request.user.id, target.id)
        return Response({'status': 'followed'})

    def delete(self, request, user_id):
        target = get_object_or_404(User, id=user_id)
        deleted_count, _ = Follow.objects.filter(follower=request.user, following=target).delete()
        if deleted_count:
            # Counters updated via post_delete signal in users/signals.py
            logger.info('User %s unfollowed user %s', request.user.id, target.id)
        return Response(status=status.HTTP_204_NO_CONTENT)
