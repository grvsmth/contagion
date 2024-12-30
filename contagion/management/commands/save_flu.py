from datetime import datetime, timedelta
from os import makedirs, path

from django.core.management.base import BaseCommand, CommandError
from django.utils.timezone import make_aware

from pymupdf import open as pdfOpen

from requests import get
from requests.exceptions import HTTPError

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
    37: 'flu_results',
    44: 'rsv_results',
    54: 'ili_visits'
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
    def fetchAndSave(cls, nowUrl, savePath, relativePath, dateString):
        fileName = filePrefix + dateString + '.pdf'
        nowUrl = nowUrl + fileName
        saveFileName = savePath + fileName
        relativeFilePath = relativePath + fileName

        res = get(nowUrl, stream=True)
        res.raise_for_status()

        with open(saveFileName, 'wb') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)

        return {
            'mime_type': mimeType['pdf'],
            'path': relativeFilePath,
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

    def cacheImageMetadata(self, metadata, document):
        chartImageData = ChartImageSerializer(data=metadata)

        try:
            chartImageData.instance = ChartImage.objects.get(
                end_date=metadata.get('end_date'),
                chart_type=metadata.get('chart_type')
            )
        except(ChartImage.DoesNotExist, ValidationError):
            pass

        chartImageData.is_valid(raise_exception=True)
        chartImageData.save(document=document)

    def extractImages(self, relativeDocumentPath, dateString):
        documentDate = make_aware(datetime.strptime(
            dateString, self.fileDateFormat
        ))

        document = Document.objects.get(path=relativeDocumentPath)

        filePath = MEDIA_ROOT + relativeDocumentPath
        if not path.isfile(filePath):
            print('Not a file: ' + filePath)
            exit(1)

        relativePath = FLU_PATH['IMAGE'] + dateString
        savePath = MEDIA_ROOT + relativePath

        if not path.exists(savePath):
            makedirs(savePath)

        pdfDoc = pdfOpen(filePath)
        for page in pdfDoc:
            for imageMetadata in page.get_images():
                xref = imageMetadata[0]

                if xref not in chartType:
                    continue

                imageData = pdfDoc.extract_image(xref)
                outputFilename = chartType[xref] + '.' + imageData['ext']

                with open(savePath + '/' + outputFilename, 'wb') as fh:
                    fh.write(imageData['image'])

                self.cacheImageMetadata(
                    {
                        'document': document.pk,
                        'end_date': documentDate,
                        'chart_type': chartType[xref],
                        'path': relativePath + '/' + outputFilename
                    },
                    document
                )

    def handle(self, *args, **options):
        dateString = options['date']
        fromCache = options['from_cache']

        locality = self.getLocality(self.localityName)

        if not dateString:
            dateString = self.guessNextDate(locality)

        savePath = MEDIA_ROOT + FLU_PATH['PDF']

        if not fromCache:
            try:
                metadata = self.fetchAndSave(
                    locality.now_url, savePath, FLU_PATH['PDF'], dateString
                )
            except HTTPError as e:
                if e.response.status_code != 404:
                    print('Error fetching flu PDF: ' + e.response.reason)
                return

            self.cacheDocumentMetadata(locality, metadata, dateString)

        saveFileName = FLU_PATH['PDF'] + filePrefix + dateString + '.pdf'
        self.extractImages(saveFileName, dateString)
