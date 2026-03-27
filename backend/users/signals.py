# Follow counter updates are handled directly in users/views.py via F() expressions,
# keeping them synchronous to avoid race conditions with async Celery tasks.
