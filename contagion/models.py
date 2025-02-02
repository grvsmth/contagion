from django.db.models import (
    BooleanField,
    CASCADE,
    CharField,
    DateTimeField,
    FloatField,
    ForeignKey,
    IntegerField,
    Model,
    TextField
    )

class Locality(Model):
    name = CharField("Name", max_length=1000, unique=True)
    now_url = CharField(
        "Now URL", max_length=2083, null=True, blank=True
    )
    time_zone_name = CharField("Time zone name", max_length=255)
    source_name = CharField("Source", max_length=1000)
    info_url = CharField("Info URL", max_length=2083, null=True, blank=True)

class DayData(Model):
    date_of_interest = DateTimeField('date of interest', unique=True)
    hospitalized_count = IntegerField()
    hosp_count_7day_avg = IntegerField()
    case_count = IntegerField()
    probable_case_count = IntegerField()
    case_count_7day_avg = IntegerField()
    all_case_count_7day_avg = IntegerField()
    death_count = IntegerField()
    death_count_7day_avg = IntegerField()
    incomplete = BooleanField()

    locality = ForeignKey(
        Locality,
        verbose_name="locality",
        related_name='dayData',
        on_delete=CASCADE
    )

class RespData(Model):
    week_ending_date = DateTimeField('week ending date', db_index=True)
    season = CharField("season", max_length=10, db_index=True)

    mmwr_year = IntegerField()
    mmwr_week = IntegerField()

    combined_rate = FloatField()
    covid_rate = FloatField()
    flu_rate = FloatField()
    rsv_rate = FloatField()

    locality = ForeignKey(
        Locality,
        verbose_name="locality",
        related_name='respData',
        on_delete=CASCADE
    )

class WastewaterData(Model):
    annotation = CharField("annotation", max_length=4096, null=True)
    sample_date = DateTimeField('sample date')
    test_date = DateTimeField('test date', null=True)
    wrrf_name = CharField("WRRF Name", max_length=2083)
    wrrf_abbreviation = CharField("WRRF Abbreviation", max_length=10)
    copies_l = FloatField(default=0.0)
    copies_l_x_average_flowrate = IntegerField(default=0)
    population_served = IntegerField()
    technology = CharField("technology", max_length=500, db_index=True)

    locality = ForeignKey(
        Locality,
        verbose_name="locality",
        related_name='wastewaterData',
        on_delete=CASCADE
    )

class WastewaterAverage(Model):
    end_date = DateTimeField('end date', db_index=True)
    wrrf = CharField('WRRF Abbreviation', max_length=10, db_index=True)
    average = IntegerField(default=0)
    locality = ForeignKey(
        Locality,
        verbose_name="locality",
        related_name='wastewaterAverage',
        on_delete=CASCADE
    )


class Document(Model):
    locality = ForeignKey(
        Locality,
        verbose_name="locality",
        related_name='document',
        on_delete=CASCADE
    )
    mime_type = CharField("MIME type", max_length=128, db_index=True)
    path = CharField("path", max_length=4096)
    publication_date = DateTimeField('Publication date', db_index=True)
    source_url = CharField("path", max_length=4096)


class ChartImage(Model):
    document = ForeignKey(
        Document,
        verbose_name="document",
        related_name='chartImage',
        on_delete=CASCADE
    )
    path = CharField("path", max_length=4096)
    chart_type = CharField('Chart type', max_length=32, db_index=True)
    end_date = DateTimeField('end date', db_index=True)


class HighlightsText(Model):
    document = ForeignKey(
        Document,
        verbose_name="document",
        related_name='hightlightsText',
        on_delete=CASCADE
    )
    intro = TextField("intro")
    bullets = TextField('bullets')
