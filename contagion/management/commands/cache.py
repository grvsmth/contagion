from csv import DictReader
from requests import get

source = 'https://raw.githubusercontent.com/nychealth/coronavirus-data/refs/heads/master/latest/now-data-by-day.csv'

res = get(source)

content = res.content.decode('utf-8')
cr = DictReader(content.splitlines())

print(cr.__next__())
