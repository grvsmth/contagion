from datetime import datetime, timedelta
from json import dumps
from os.path import isfile

from django.core.management.base import BaseCommand, CommandError

from pdfminer.high_level import extract_pages
from pdfminer.image import ImageWriter
from pdfminer.layout import LTFigure, LTImage

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

chartType = {
    1: 'flu_cases',
    2: 'rsv_cases'
}


class Command(BaseCommand):
    help = "Retrieves updated data for the specified localities and caches it"

    fileDateFormat = "%m%d%Y"
    localityName = 'Nyc_Flu_Pdf'

    def add_arguments(self, parser):
        parser.add_argument("--date")
        parser.add_argument(
            "--from_cache",
            action="store_true",
            help="Load file from cache",
        )

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

    def cacheDocumentMetadata(self, locality, content, dateString):
        content['locality'] = locality.pk
        content['publication_date'] = datetime.strptime(
            dateString, self.fileDateFormat
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

        return documentData

    def guessNextDate(self, locality):
        latestDoc = Document.objects.order_by('-publication_date').first()
        return (latestDoc.publication_date + timedelta(7)).strftime(
            self.fileDateFormat
        )

    def cacheImagesMetadata(self, documentDate, imageList):
        for imageName in imageList:
            print(imageName)

    def extractImages(self, filePath, dateString):
        documentDate = datetime.strptime(dateString, self.fileDateFormat)
        imageWriter = ImageWriter(MEDIA_ROOT + FLU_PATH['IMAGE'] + dateString)

        if not isfile(filePath):
            print('Not a file: ' + filePath)
            exit(1)

        imageList = []
        for page_layout in extract_pages(filePath):
            for element in page_layout:
                if isinstance(element, LTFigure):
                    for subElement in element:
                        if isinstance(subElement, LTImage):
                            imageName = imageWriter.export_image(subElement)
                            imageList.append(imageName)

        self.cacheImagesMetadata(documentDate, imageList)

    def handle(self, *args, **options):
        dateString = options['date']
        fromCache = options['from_cache']

        locality = self.getLocality(self.localityName)

        if not dateString:
            dateString = self.guessNextDate(locality)

        savePath = MEDIA_ROOT + FLU_PATH['PDF']

        if not fromCache:
            metadata = self.fetchAndSave(
                locality.now_url, savePath, dateString
            )
            self.cacheDocumentMetadata(locality, metadata, dateString)

        saveFileName = savePath + filePrefix + dateString + '.pdf'
        self.extractImages(saveFileName, dateString)
