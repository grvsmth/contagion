from django.contrib.auth.models import Group, User
from rest_framework.serializers import (
    HyperlinkedModelSerializer, PrimaryKeyRelatedField
)

from contagion.models import (
    ChartImage,
    DayData,
    Document,
    HighlightsText,
    Locality,
    RespData,
    WastewaterAverage,
    WastewaterData
)

class GroupSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']


class LocalitySerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Locality
        fields = [
            'pk',
            'name',
            'now_url',
            'time_zone_name',
            'source_name',
            'info_url'
        ]

class DayDataSerializer(HyperlinkedModelSerializer):
    locality = PrimaryKeyRelatedField(
        queryset=Locality.objects.all()
    )

    class Meta:
        model = DayData
        fields = [
            'locality',
            'date_of_interest',
            'hospitalized_count',
            'hosp_count_7day_avg',
            'case_count',
            'probable_case_count',
            'case_count_7day_avg',
            'all_case_count_7day_avg',
            'death_count',
            'death_count_7day_avg',
            'incomplete'
        ]


class RespDataSerializer(HyperlinkedModelSerializer):
    locality = PrimaryKeyRelatedField(
        queryset=Locality.objects.all()
    )

    class Meta:
        model = RespData
        fields = [
            'locality',
            'week_ending_date',
            'season',
            'mmwr_year',
            'mmwr_week',
            'combined_rate',
            'covid_rate',
            'flu_rate',
            'rsv_rate'
        ]


class UserSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class WastewaterDataSerializer(HyperlinkedModelSerializer):
    locality = PrimaryKeyRelatedField(
        queryset=Locality.objects.all()
    )

    class Meta:
        model = WastewaterData
        fields = [
            'locality',
            'annotation',
            'sample_date',
            'test_date',
            'wrrf_name',
            'wrrf_abbreviation',
            'copies_l',
            'copies_l_x_average_flowrate',
            'population_served',
            'technology'
        ]


class WastewaterAverageSerializer(HyperlinkedModelSerializer):
    locality = PrimaryKeyRelatedField(
        queryset=Locality.objects.all()
    )

    class Meta:
        model = WastewaterAverage
        fields = [
            'locality',
            'end_date',
            'wrrf',
            'average'
        ]

class DocumentSerializer(HyperlinkedModelSerializer):
    locality = PrimaryKeyRelatedField(
        queryset=Locality.objects.all()
    )

    class Meta:
        model = Document
        fields = [
            'locality',
            'mime_type',
            'path',
            'pk',
            'publication_date',
            'source_url'
        ]


class ChartImageSerializer(HyperlinkedModelSerializer):
    document = PrimaryKeyRelatedField(
        queryset=Document.objects.all()
    )

    class Meta:
        model = ChartImage
        fields = [
            'document',
            'end_date',
            'chart_type',
            'path'
        ]


class HighlightsTextSerializer(HyperlinkedModelSerializer):
    document = PrimaryKeyRelatedField(
        queryset=Document.objects.all()
    )

    class Meta:
        model = HighlightsText
        fields = [
            'document',
            'intro',
            'bullets'
        ]
