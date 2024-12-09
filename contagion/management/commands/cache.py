from csv import DictReader
from datetime import datetime
from zoneinfo import ZoneInfo


from django.core.management.base import BaseCommand, CommandError
from requests import get
from rest_framework.exceptions import ValidationError
from rest_framework.reverse import reverse

from contagion.models import DayData, Locality
from contagion.serializers import DayDataSerializer


class Command(BaseCommand):
    help = "Retrieves updated data for the specified localities and caches it"

    def add_arguments(self, parser):
        parser.add_argument("localities", nargs="+")

    @staticmethod
    def fetch(nowUrl):
        res = get(nowUrl)
        return res.content.decode('utf-8')

    @staticmethod
    def convertDayData(locality, row):
        dayDict = {key.lower(): value for key, value in row.items()}

        (month, day, year) = row['date_of_interest'].split('/')
        dateTimeOfInterest = datetime(
            int(year),
            int(month),
            int(day),
            tzinfo=ZoneInfo(locality.time_zone_name)
        )
        dayDict['date_of_interest'] = str(dateTimeOfInterest)
        dayDict['Locality'] = reverse('locality-list', {'name': locality.name})
        print('locality.name = ' + str(locality.name))
        print('Locality = ' + dayDict['Locality'])
        dayDict['incomplete'] = int(row['INCOMPLETE']) > 0

        return dayDict

    def cache(self, locality, content):
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
            dayData.save(Locality=locality)

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
            self.cache(locality, content)
