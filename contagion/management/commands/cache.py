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

from contagion.models import (
    DayData, Locality, RespData, WastewaterData, WastewaterAverage
)

from contagion.serializers import (
    DayDataSerializer,
    RespDataSerializer,
    WastewaterDataSerializer,
    WastewaterAverageSerializer
)

from contagion.settings import NYC_OPEN_DATA

averageRange = 14
sortableFormat = '%Y-%m-%d'

networkRate = {
    "Combined": "combined_rate",
    "COVID-NET": "covid_rate",
    "FluSurv-NET": "flu_rate",
    "RSV-NET": "rsv_rate"
}


class Command(BaseCommand):
    help = "Retrieves updated data for the specified localities and caches it"

    wastewaterByDate = {}
    wastewaterDates = {}

    def add_arguments(self, parser):
        parser.add_argument("localities", nargs="+")

    @staticmethod
    def fetch(nowUrl, localityName='NYC'):
        if localityName == 'NYC_Wastewater':
            nowUrl = (nowUrl
            + '?$limit=5000&$$app_token=' + NYC_OPEN_DATA['APP_TOKEN']
            + '&technology=' + NYC_OPEN_DATA['WASTEWATER_TECHNOLOGY'])

        res = get(nowUrl)
        return res.content.decode('utf-8')

    @staticmethod
    def convertDate(inputDate):
        inputDatetime = make_aware(datetime.fromisoformat(inputDate))
        return str(inputDatetime)

    @staticmethod
    def sortableDate(inputDate):
        inputDatetime = make_aware(datetime.fromisoformat(inputDate))
        return inputDatetime.strftime(sortableFormat)

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

            data[key] = self.convertDate(row[key])

        data['locality'] = locality.pk

        wrrf = data['wrrf_abbreviation']
        if not wrrf in self.wastewaterDates:
            self.wastewaterDates[wrrf] = []
            self.wastewaterByDate[wrrf] = {}

        sortableDate = self.sortableDate(row['sample_date'])
        self.wastewaterDates[wrrf].append(sortableDate)
        self.wastewaterByDate[wrrf][sortableDate] = data.get(
            'copies_l', 0
        )

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

    def cacheRespData(self, locality, content):
        byWeek = {}

        for networkWeek in loads(content):
            network = networkWeek['surveillance_network']
            if network not in networkRate:
                print("Unknown surveillance_network: " + network)
                continue

            rateKey = networkRate[network]
            weekEndDate = self.convertDate(networkWeek['_weekenddate'])

            if weekEndDate not in byWeek:
                byWeek[weekEndDate] = {
                    'combined_rate': 0.0,
                    'covid_rate': 0.0,
                    'flu_rate': 0.0,
                    'locality': locality.pk,
                    'mmwr_week': networkWeek['mmwr_week'],
                    'mmwr_year': networkWeek['mmwr_year'],
                    'rsv_rate': 0.0,
                    'season': networkWeek['season'],
                    'week_ending_date': weekEndDate
                }

            byWeek[weekEndDate][rateKey] = networkWeek['weekly_rate']

        for week in byWeek.values():
            respData = RespDataSerializer(data=week)

            try:
                respData.instance = RespData.objects.get(
                    week_ending_date=week.get('week_ending_date')
                )
            except(RespData.DoesNotExist, ValidationError):
                pass

            respData.is_valid(raise_exception=True)
            respData.save(locality=locality)

    def cacheWastewaterAverage(self, data, locality):
        averageData = WastewaterAverageSerializer(data=data)

        try:
            averageData.instance = WastewaterAverage.objects.get(
                end_date=data.get('end_date')
            )
        except(WastewaterAverage.DoesNotExist, ValidationError):
            pass

        averageData.is_valid(raise_exception=True)
        averageData.save(locality=locality)

    def cacheWastewaterAverages(self, locality):
        for wrrf, data in self.wastewaterByDate.items():
            sortedDates = sorted(self.wastewaterDates[wrrf])

            firstDate = datetime.strptime(sortedDates[0], sortableFormat)
            lastDate = datetime.strptime(sortedDates[-1], sortableFormat)

            dayCount = (lastDate - firstDate).days + 1
            previousAverage = 0

            for day in range(dayCount):
                copies = []
                endDate = firstDate + timedelta(day)

                for sampleDay in range(1 - averageRange, 1):
                    sampleDate = endDate + timedelta(sampleDay)
                    sampleDateString = sampleDate.strftime(sortableFormat)

                    if sampleDateString in data:
                        copies.append(float(data.get(sampleDateString)))

                if not copies:
                    continue

                average = round(fmean(copies))

                if previousAverage == average:
                    continue

                previousAverage = average
                dbDate = str(make_aware(endDate))
                self.cacheWastewaterAverage(
                    {
                        'wrrf': wrrf,
                        'end_date': dbDate,
                        'average': average,
                        'locality': locality.pk
                    },
                    locality
                )

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

            if localityName == 'CDC_RESP_NET':
                self.cacheRespData(locality, content)

            if localityName == 'NYC_Wastewater':
                self.cacheWastewater(locality, content)
                self.cacheWastewaterAverages(locality)
