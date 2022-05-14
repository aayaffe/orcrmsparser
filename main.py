from certs_downloader import download_certs
from settings import year
from targettime import generate_target_time_file
import argparse

parser = argparse.ArgumentParser(description="ORC certificate files utils")
group = parser.add_mutually_exclusive_group()
group.add_argument("-d", "--download", help="Download latest certificate files from orc.org", action="store_true")
group.add_argument("-g", "--generate", help="Generate target time tables", action="store_true")
args = parser.parse_args()

if args.download:
    download_certs(year)
elif args.generate:
    generate_target_time_file(f'boats/timetables.xlsx', [], ['ISR'], 'jsons/')
else:
    print("No arguments provided")
