import json

import requests

from utils import create_folder

families = {1: 'STD', 3: 'DH', 5: 'NS'}

URL = "http://data.orc.org/public/WPub.dll?action=DownRMS&ext=json&CountryId="
countries = "AHO ARG AUS AUT BRA BUL CAN CRO CYP DEN ECU ESP EST FIN FRA GBR GER GRE HKG HUN ISR ITA JPN KOR LAT LTU MLT MNE NED NLS NOR PER POL POR ROU RSA RUS SLO SUI SWE TUR UKR USA".split()
headers = {'Connection': 'keep-alive', 'Accept-Encoding': 'gzip, deflate, sdch',
           'Referer': 'https://data.orc.org/public/WPub.dll'}
filename = f'jsons/'


def download_certs(year):
    create_folder(filename)
    for country in countries:
        for family, family_name in families.items():
            resp = requests.get(f"{URL}{country}&Family={str(family)}&VPPYear={year}", headers=headers)
            resp.encoding = 'utf-8-sig'
            data = resp.json(strict=False)
            with open(f"jsons/{country}_{family_name}_{str(year)}.json", 'w') as f:
                json.dump(data["rms"], f)
                print(f"Downloaded {country} {family_name} {str(year)}")
