from copy import deepcopy
from csv import DictReader
from datetime import datetime
from json import loads
from zoneinfo import ZoneInfo


from django.core.management.base import BaseCommand, CommandError
from django.utils.timezone import make_aware

from requests import get
from rest_framework.exceptions import ValidationError

from contagion.models import DayData, Locality, WastewaterData
from contagion.serializers import DayDataSerializer, WastewaterDataSerializer
from contagion.settings import NYC_OPEN_DATA


class Command(BaseCommand):
    help = "Retrieves updated data for the specified localities and caches it"

    def add_arguments(self, parser):
        parser.add_argument("localities", nargs="+")

    @staticmethod
    def fetch(nowUrl, localityName='NYC'):
        # TODO restrict by technology specified in environ
        if localityName == 'NYC_Wastewater':
            nowUrl = nowUrl + '?$limit=5000&$$app_token=' + NYC_OPEN_DATA.APP_TOKEN
        res = get(nowUrl)
        return res.content.decode('utf-8')

    @staticmethod
    def convertDate(locality, inputDate):
        inputDatetime = make_aware(datetime.fromisoformat(inputDate))
        return str(inputDatetime)

    @classmethod
    def convertDayData(cls, locality, row):
        dayDict = {key.lower(): value for key, value in row.items()}

        (month, day, year) = row['date_of_interest'].split('/')
        inputDatetime = datetime(
            int(year),
            int(month),
            int(day),
            tzinfo=ZoneInfo(locality.time_zone_name)
        )
        dayDict['date_of_interest'] = str(inputDatetime)

        dayDict['locality'] = locality.pk
        dayDict['incomplete'] = int(row['INCOMPLETE']) > 0

        return dayDict

    @classmethod
    def convertWastewater(cls, locality, row):
        data = deepcopy(row)

        for key in ('sample_date', 'test_date'):
            if not key in row:
                continue

            data[key] = cls.convertDate(locality, row[key])

        data['locality'] = locality.pk

        return data

    def cacheDayData(self, locality, content):
        cr = DictReader(content.splitlines())
        for row in cr:
            dayDict = self.convertDayData(locality, row)

            # https://stackoverflow.com/questions/37833307/django-rest-framework-post-update-if-existing-or-create
            dayData = DayDataSerializer(data=dayDict)

            try:
                dayData.instance = DayData.objects.get(
                    date_of_interest=dayDict.get('date_of_interest')
                )
            except(DayData.DoesNotExist, ValidationError):
                pass

            dayData.is_valid(raise_exception=True)
            dayData.save(locality=locality)

    def cacheWastewater(self, locality, content):
        for reading in loads(content):
            wastewaterDict = self.convertWastewater(locality, reading)
            wastewaterData = WastewaterDataSerializer(data=wastewaterDict)

            try:
                wastewaterData.instance = WastewaterData.objects.get(
                    sample_date=wastewaterDict.get('sample_date'),
                    wrrf_abbreviation=wastewaterDict.get('wrrf_abbreviation')
                )
            except(WastewaterData.DoesNotExist, ValidationError):
                pass

            wastewaterData.is_valid(raise_exception=True)
            wastewaterData.save(locality=locality)

    def getLocality(self, localityName):
        try:
            locality = Locality.objects.get(name=localityName)
        except Locality.DoesNotExist:
            raise CommandError(
                'Locality "%s" does not exist' % localityName
            )

        return locality

    def handle(self, *args, **options):
        for localityName in options['localities']:
            locality = self.getLocality(localityName)
            content = self.fetch(locality.now_url)

            if localityName == 'NYC':
                self.cacheDayData(locality, content)

            if localityName == 'NYC_Wastewater':
                self.cacheWastewater(locality, content)