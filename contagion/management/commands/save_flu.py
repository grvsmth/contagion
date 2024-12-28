from datetime import datetime

from django.core.management.base import BaseCommand, CommandError

from requests import get
from rest_framework.exceptions import ValidationError

from contagion.models import Locality, ChartImage, Document
from contagion.serializers import DocumentSerializer, ChartImageSerializer
from contagion.settings import MEDIA_ROOT, FLU_PATH

# url = "https://www.nyc.gov/assets/doh/downloads/pdf/hcp/weekly-surveillance12142024.pdf"
filePrefix = 'weekly-surveillance'

mimeType = {
    'pdf': 'application/pdf',
    'png': 'image/png'
}


class Command(BaseCommand):
    help = "Retrieves updated data for the specified localities and caches it"

    fileDateFormat = "%m%d%Y"
    localityName = 'Nyc_Flu_Pdf'

    def add_arguments(self, parser):
        parser.add_argument("date")

    @classmethod
    def fetchAndSave(cls, nowUrl, savePath, dateString):
        fileName = filePrefix + dateString + '.pdf'
        nowUrl = nowUrl + fileName
        saveFileName = savePath + fileName

        res = get(nowUrl, stream=True)
        with open(saveFileName, 'wb') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)

        return {
            'mime_type': mimeType['pdf'],
            'path': saveFileName,
            'source_url': nowUrl
        }

    def getLocality(self, localityName):
        try:
            locality = Locality.objects.get(name=localityName)
        except Locality.DoesNotExist:
            raise CommandError(
                'Locality "%s" does not exist' % localityName
            )

        return locality

    def cacheDocumentMetadata(self, locality, content, dateTime):
        content['locality'] = locality.pk
        content['publication_date'] = datetime.strptime(
            dateTime, self.fileDateFormat
        )

        documentData = DocumentSerializer(data=content)

        try:
            documentData.instance = Document.objects.get(
                source_url=content.get('source_url')
            )
        except(Document.DoesNotExist, ValidationError):
            pass

        documentData.is_valid(raise_exception=True)
        documentData.save(locality=locality)

    def handle(self, *args, **options):
        dateString = options['date']
        locality = self.getLocality(self.localityName)

        if not dateString:
            dateString = self.guessNextDate(locality)

        savePath = MEDIA_ROOT + FLU_PATH['PDF']
        content = self.fetchAndSave(
            locality.now_url, savePath, dateString
        )

        self.cacheDocumentMetadata(locality, content, dateString)
