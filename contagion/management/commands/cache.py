from csv import DictReader

from django.core.management.base import BaseCommand, CommandError
from requests import get
from rest_framework.exceptions import ValidationError

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
    def convertDayData(name, row):
        dayDict = {key.lower(): value for key, value in row.items()}

        (month, day, year) = row['date_of_interest'].split('/')
        # TODO timezone
        dayDict['date_of_interest'] = '-'.join((year, month, day)) + 'T00:00'

        return dayDict

    def cache(self, name, content):
        cr = DictReader(content.splitlines())
        row = cr.__next__()
        print(row)
        dayDict = self.convertDayData(name, row)
        print(dayDict)

        # https://stackoverflow.com/questions/37833307/django-rest-framework-post-update-if-existing-or-create
        try:
            dayData = DayData.objects.get(
                date_of_interest=dayDict.get('date_of_interest')
            )
        except(DayData.DoesNotExist, ValidationError):
            pass

#        return DayDataSerializer(data=dayDict)
        dayData.is_valid(raise_exception=True)
        print(dayData.data)


    def getNowUrl(self, localityName):
        try:
            locality = Locality.objects.get(name=localityName)
        except Locality.DoesNotExist:
            raise CommandError(
                'Locality "%s" does not exist' % localityName
            )

        return locality.now_url

    def handle(self, *args, **options):
        for localityName in options['localities']:
            print('You want to update %s' % localityName)
            nowUrl = self.getNowUrl(localityName)
            content = self.fetch(nowUrl)
            self.cache(localityName, content)
