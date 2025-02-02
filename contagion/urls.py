"""contagion URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf.urls.static import static
from django.urls import include, path
from django.views.generic import TemplateView
from rest_framework import routers

from contagion.views import (
    ChartImageViewSet,
    DayDataViewSet,
    DocumentViewSet,
    GroupViewSet,
    HighlightsTextViewSet,
    UserViewSet,
    LocalityViewSet,
    RespDataViewSet,
    WastewaterAverageViewSet,
    WastewaterDataViewSet,
)
from contagion.settings import API_VERSION, MEDIA_ROOT, MEDIA_URL

router = routers.DefaultRouter()
router.register(r'chart-images', ChartImageViewSet)
router.register(r'day-data', DayDataViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'highlights-text', HighlightsTextViewSet)
router.register(r'localities', LocalityViewSet)
router.register(r'resp-data', RespDataViewSet)
router.register(r'users', UserViewSet)
router.register(r'wastewater-averages', WastewaterAverageViewSet)
router.register(r'wastewater-data', WastewaterDataViewSet)


urlpatterns = [
    path('api/{}/'.format(API_VERSION), include(router.urls)),
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('about.html', TemplateView.as_view(template_name='about.html'),
    name='about'),
    path('', TemplateView.as_view(template_name='index.html'),
    name='index'),
] + static(MEDIA_URL, document_root=MEDIA_ROOT)
