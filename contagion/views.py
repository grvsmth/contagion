from django.contrib.auth.models import Group, User
from django_filters.rest_framework import FilterSet
from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet

from contagion.models import (
    ChartImage,
    DayData,
    Document,
    HighlightsText,
    Locality,
    RespData,
    WastewaterAverage,
    WastewaterData,
    WeekData
)

from contagion.serializers import (
    ChartImageSerializer,
    WeekDataSerializer,
    DayDataSerializer,
    DocumentSerializer,
    GroupSerializer,
    HighlightsTextSerializer,
    LocalitySerializer,
    RespDataSerializer,
    UserSerializer,
    WastewaterAverageSerializer,
    WastewaterDataSerializer
)

class ChartImageFilter(FilterSet):
    class Meta:
        model = ChartImage
        fields = ['end_date', 'chart_type', 'document']

class DayDataFilter(FilterSet):
    class Meta:
        model = DayData
        fields = ['date_of_interest', 'incomplete', 'locality']

class WeekDataFilter(FilterSet):
    class Meta:
        model = WeekData
        fields = ['date', 'metric', 'submetric', 'locality']

class HighlightsTextFilter(FilterSet):
    class Meta:
        model = HighlightsText
        fields = ['document']

class RespDataFilter(FilterSet):
    class Meta:
        model = RespData
        fields = ['mmwr_year', 'season', 'week_ending_date', 'locality']

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


class ChartImageViewSet(ModelViewSet):
    """
    API endpoint that allows chart image metadata to be viewed or edited.
    """
    queryset = ChartImage.objects.all().order_by('end_date')
    serializer_class = ChartImageSerializer
    filterset_class = ChartImageFilter


class DayDataViewSet(ModelViewSet):
    """
    API endpoint that allows daily data (cases, deaths) to be viewed or edited.
    """
    queryset = DayData.objects.all().order_by('date_of_interest')
    serializer_class = DayDataSerializer
    filterset_class = DayDataFilter


class WeekDataViewSet(ModelViewSet):
    """
    API endpoint that allows weekly data (cases, deaths) to be viewed or edited.
    """
    queryset = WeekData.objects.all().order_by('date')
    serializer_class = WeekDataSerializer
    filterset_class = WeekDataFilter

class RespDataViewSet(ModelViewSet):
    """
    API endpoint that allows RESP-Net data (cases, deaths) to be viewed or edited.
    """
    queryset = RespData.objects.all().order_by('week_ending_date')
    serializer_class = RespDataSerializer
    filterset_class = RespDataFilter


class DocumentViewSet(ModelViewSet):
    """
    API endpoint that allows document metadata to be viewed or edited.
    """
    queryset = Document.objects.all().order_by('publication_date')
    serializer_class = DocumentSerializer


class HighlightsTextViewSet(ModelViewSet):
    """
    API endpoint that allows highlights text to be viewed or edited.
    """
    queryset = HighlightsText.objects.all().order_by('document')
    serializer_class = HighlightsTextSerializer
    filterset_class = HighlightsTextFilter


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
