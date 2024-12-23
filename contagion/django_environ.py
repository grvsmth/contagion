"""

Environment variables for Django

"""
from json import dumps
from os import environ

def set_environ():
    """
    Update the environment variables
    """
    environ.update({
        'DJANGO_SECRET_KEY': 'django-insecure-2f^ii&xc5qjin7fk$@4abk!wm(63owm#b#=_)8*1bmr82cj_0_',
        'DJANGO_HOST': 'contation.grieve-smith.com',
        'DJANGO_DB': 'grvsmth$contagion',
        'DJANGO_DB_USER': 'grvsmth',
        'DJANGO_DB_PASSWORD': 'myAnnotate',
        'DJANGO_DB_HOST': 'grvsmth.mysql.pythonanywhere-services.com',
        'DJANGO_DB_PORT': '3306',
        'DJANGO_DB_ENGINE': 'django.db.backends.mysql',
        'DJANGO_DB_OPTIONS': dumps({
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"
            }),
        'DJANGO_ALLOWED_HOSTS': '[]',
        'DJANGO_TIMEZONE': "America/New_York",
        'JWT_EXPIRATION': '2',
        'JWT_EXPIRATION_UNITS': 'days',
        'NYC_APP_TOKEN': 'D6gIuTeI4NSmrdqjPBzdre4VI',
        'NYC_SECRET_TOKEN': 'vu55d0P-nWBFJ5STzHpGr06lYtAhKtBGuWxG'
        })
