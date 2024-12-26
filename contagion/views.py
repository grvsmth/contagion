from django.contrib.auth.models import Group, User
from django_filters.rest_framework import FilterSet
from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet

from contagion.models import (
    Locality, DayData, WastewaterData, WastewaterAverage
)

from contagion.serializers import (
    GroupSerializer,
    UserSerializer,
    LocalitySerializer,
    DayDataSerializer,
    WastewaterAverageSerializer,
    WastewaterDataSerializer
)

class DayDataFilter(FilterSet):
    class Meta:
        model = DayData
        fields = ['date_of_interest', 'incomplete', 'locality']

class WastewaterDataFilter(FilterSet):
    class Meta:
        model = WastewaterData
        fields = ['sample_date', 'technology', 'wrrf_abbreviation', 'locality']

class WastewaterAverageFilter(FilterSet):
    class Meta:
        model = WastewaterAverage
        fields = ['end_date', 'wrrf', 'locality']

class UserViewSet(ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class LocalityViewSet(ModelViewSet):
    """
    API endpoint that allows localities to be viewed or edited.
    """
    queryset = Locality.objects.all().order_by('name')
    serializer_class = LocalitySerializer


class DayDataViewSet(ModelViewSet):
    """
    API endpoint that allows daily data (cases, deaths) to be viewed or edited.
    """
    queryset = DayData.objects.all().order_by('date_of_interest')
    serializer_class = DayDataSerializer
    filterset_class = DayDataFilter

class WastewaterDataViewSet(ModelViewSet):
    """
    API endpoint that allows wastewater data to be viewed or edited.
    """
    queryset = WastewaterData.objects.all().order_by('sample_date')
    serializer_class = WastewaterDataSerializer
    filterset_class = WastewaterDataFilter

class WastewaterAverageViewSet(ModelViewSet):
    """
    API endpoint that allows wastewater averages to be viewed or edited.
    """
    queryset = WastewaterAverage.objects.all().order_by('end_date')
    serializer_class = WastewaterAverageSerializer
    filterset_class = WastewaterAverageFilter
