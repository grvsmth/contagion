from django.contrib.auth.models import Group, User
from rest_framework.serializers import (
    HyperlinkedModelSerializer, PrimaryKeyRelatedField
)

from contagion.models import (
    Locality, DayData, WastewaterData, WastewaterAverage
)

class UserSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


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
