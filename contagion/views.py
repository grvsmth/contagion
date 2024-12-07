from django.contrib.auth.models import Group, User
from rest_framework import permissions, viewsets

from contagion.models import Locality, DayData
from contagion.serializers import (
    GroupSerializer, UserSerializer, LocalitySerializer, DayDataSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class LocalityViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Locality.objects.all().order_by('name')
    serializer_class = LocalitySerializer

class DayDataViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = DayData.objects.all().order_by('date_of_interest')
    serializer_class = DayDataSerializer
