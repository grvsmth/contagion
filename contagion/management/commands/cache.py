from copy import deepcopy
from csv import DictReader
from datetime import datetime, timedelta
from json import loads
from statistics import fmean
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
    wastewaterByDate = {}
    wastewaterDates = {}

    def add_arguments(self, parser):
        parser.add_argument("localities", nargs="+")

    @staticmethod
    def fetch(nowUrl, localityName='NYC'):
        # TODO restrict by technology specified in environ
        if localityName == 'NYC_Wastewater':
            nowUrl = (nowUrl
            + '?$limit=5000&$$app_token=' + NYC_OPEN_DATA['APP_TOKEN']
            + '&technology=' + NYC_OPEN_DATA['WASTEWATER_TECHNOLOGY'])
        print(nowUrl + "\n")
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

    def convertWastewater(self, locality, row):
        data = deepcopy(row)

        for key in ('sample_date', 'test_date'):
            if not key in row:
                continue

            data[key] = self.convertDate(locality, row[key])

        data['locality'] = locality.pk

        wrrf = data['wrrf_abbreviation']
        if not wrrf in self.wastewaterDates:
            self.wastewaterDates[wrrf] = []
            self.wastewaterByDate[wrrf] = {}

        self.wastewaterDates[wrrf].append(data['sample_date'])
        self.wastewaterByDate[wrrf][data['sample_date']] = data['copies_1']

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

    def cacheWastewaterAverages(self):
        firstDate = datetime.strptime(self.wastewaterDates[0])
        lastDate = datetime.strptime(self.wastewaterDates[-1])

        dayCount = (lastDate - firstDate).days + 1
        previousAverage = 0

        for wrrf, data in self.wastewaterByDate:
            for day in range(dayCount):
                copies = []
                averageDate = firstDate + timedelta(day)

                for sampleDay in range(-7,0):
                    sampleDate = (averageDate + timedelta(sampleDay)).isoformat()
                    if sampleDate in data:
                        copies.append(data[sampleDate])

                if not copies:
                    continue

                average = round(fmean(copies))

                if previousAverage == average:
                    continue

                sortableDate = averageDate.isoformat()
                this.cacheWastewaterAverage(wrrf, sortableDate, average)
                previousAverage = average

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
            content = self.fetch(locality.now_url, localityName)

            if localityName == 'NYC':
                self.cacheDayData(locality, content)

            if localityName == 'NYC_Wastewater':
                self.cacheWastewater(locality, content)