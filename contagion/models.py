from django.db.models import (
    CASCADE,
    CharField,
    DateTimeField,
    ForeignKey,
    IntegerField,
    Model
    )

class Locality(Model):
    name = CharField("Name", max_length=1000)
    now_url = CharField(
        "Now URL", max_length=2083, null=True, blank=True
    )

class DayData(Model):
    date_of_interest = DateTimeField('date of interest')
    hospitalized_count = IntegerField()
    hospitalized_count_7day_avg = IntegerField()
    case_count = IntegerField()
    probable_case_count = IntegerField()
    case_count_7day_avg = IntegerField()
    all_case_count_7day_avg = IntegerField()
    death_count = IntegerField()
    death_count_7day_avg = IntegerField()

    Locality = ForeignKey(Locality, verbose_name="locality", on_delete=CASCADE)
