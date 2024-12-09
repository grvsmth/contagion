from django.contrib.auth.models import Group, User
from rest_framework.serializers import (
    HyperlinkedModelSerializer, HyperlinkedIdentityField
)

from contagion.models import Locality, DayData

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
        fields = ['name', 'now_url', 'time_zone_name']

class DayDataSerializer(HyperlinkedModelSerializer):
    localityUrl = HyperlinkedIdentityField(view_name='locality-detail')
    class Meta:
        model = DayData
        fields = [
            'localityUrl',
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
