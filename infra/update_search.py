import sys

with open('/home/jeka/foodyFront/backend/posts/views/posts.py', 'r') as f:
    content = f.read()

custom_filter = """
class SmartPostSearchFilter(SearchFilter):
    def get_search_terms(self, request):
        params = request.query_params.get(self.search_param, '')
        params = params.replace('#', '')
        params = params.replace('\\x00', '')
        params = params.replace(',', ' ')
        return params.split()

class BasePostViewSet(viewsets.ModelViewSet):
"""

content = content.replace("class BasePostViewSet(viewsets.ModelViewSet):", custom_filter)

content = content.replace(
    "filter_backends = [SearchFilter]",
    "filter_backends = [SmartPostSearchFilter]"
)

content = content.replace(
    "search_fields = ['dish__name', 'restaurant__name']",
    "search_fields = ['dish__name', 'restaurant__name', 'tags__name', 'dish__categories__name', 'restaurant__categories__name', 'description']"
)

with open('/home/jeka/foodyFront/backend/posts/views/posts.py', 'w') as f:
    f.write(content)

