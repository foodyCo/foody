import sys

with open('/home/jeka/foodyFront/backend/config/settings.py', 'r') as f:
    text = f.read()

text = text.replace("'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60)", "'ACCESS_TOKEN_LIFETIME': timedelta(days=30)")

with open('/home/jeka/foodyFront/backend/config/settings.py', 'w') as f:
    f.write(text)

