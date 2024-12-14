from django.db.models import (
    BooleanField,
    CASCADE,
    CharField,
    DateTimeField,
    ForeignKey,
    IntegerField,
    Model
    )

class Locality(Model):
    name = CharField("Name", max_length=1000, unique=True)
    now_url = CharField(
        "Now URL", max_length=2083, null=True, blank=True
    )
    time_zone_name = CharField("Time zone name", max_length=255)

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
