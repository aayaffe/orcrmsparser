import json
import os
import shutil
from datetime import datetime
import aiohttp
import asyncio
import time
# import requests

from utils import create_folder

families = {1: 'STD', 3: 'DH', 5: 'NS'}

URL = "http://data.orc.org/public/WPub.dll?action=DownRMS&ext=json&CountryId="
countries = "AHO ARG AUS AUT BRA BUL CAN CRO CYP DEN ECU ESP EST FIN FRA GBR GER GRE HKG HUN ISR ITA JPN KOR LAT LTU MLT MNE NED NLS NOR PER POL POR ROU RSA RUS SLO SUI SWE TUR UKR USA".split()
headers = {'Connection': 'keep-alive', 'Accept-Encoding': 'gzip, deflate, sdch',
           'Referer': 'https://data.orc.org/public/WPub.dll'}


async def get_certs(session, year, country, family, family_name, date_time, path):
    url = f"{URL}{country}&Family={str(family)}&VPPYear={year}"
    async with session.get(url, headers=headers) as resp:
        try:
            data = await resp.json(encoding='utf-8-sig', content_type=None)  # , strict=False
            with open(f"{path}{country}_{family_name}_{str(year)}{date_time}.json", 'w') as f:
                json.dump(data, f)
                count = len(data["rms"])
                print(f"Downloaded {country} {family_name} {str(year)} - {count} certs")
        except Exception as e:
            print(e)
            print(await resp.text())
            print(f"Error {country} {family_name} {str(year)}")


async def download_certs_async(year, path, backup):
    create_folder(path)
    now = datetime.now()
    date_time = now.strftime("_%d%m%Y %H%M%S") if backup else ''
    connector = aiohttp.TCPConnector(limit_per_host=5)
    async with aiohttp.ClientSession(connector=connector) as session:

        tasks = []
        for country in countries:
            for family, family_name in families.items():
                tasks.append(asyncio.ensure_future(get_certs(session, year, country, family, family_name, date_time, path)))

        await asyncio.gather(*tasks)


def download_certs(year, path=f'jsons/', backup=True):
    start_time = time.time()
    if backup:
        source_dir = path
        target_dir = 'jsons_history/'
        file_names = os.listdir(source_dir)
        for file_name in file_names:
            shutil.move(os.path.join(source_dir, file_name), target_dir)
    asyncio.run(download_certs_async(year, path, backup))
    print("--- %s seconds ---" % (time.time() - start_time))
