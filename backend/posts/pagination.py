from rest_framework.pagination import CursorPagination, PageNumberPagination
from django.conf import settings

class StandardResultsCursorPagination(CursorPagination):
    """
    Пагинация на основе курсора. 
    Идеальна для бесконечных лент (соцсетей), так как:
    1. Работает за O(1) на любых объемах данных.
    2. Не дублирует посты при добавлении новых в начало ленты.
    """
    page_size = settings.REST_FRAMEWORK.get('PAGE_SIZE', 10)
    ordering = '-created_at'
    cursor_query_param = 'cursor'


class ModerationPagination(PageNumberPagination):
    """
    Постраничная пагинация для очереди модерации.
    Используем PageNumberPagination (не Cursor), т.к. модератор листает страницы вперёд/назад.
    """
    page_size = settings.MODERATION_PAGE_SIZE
    page_size_query_param = 'page_size'
