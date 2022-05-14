import mimetypes
import os
import sys

from django.http import HttpResponse
from django.shortcuts import render

sys.path.append(os.getcwd() + '/..')
from targettime import generate_target_time_file
from certs_downloader import download_certs


def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")


def download_target_time_file(request):
    filepath = 'orccerts/Files/target_time.xlsx'
    countries = ['ISR']
    generate_target_time_file(filepath, countries=countries, path='orccerts/Files/Jsons/')
    filename = 'target_time.xlsx'
    path = open(filepath, 'rb')
    mime_type, _ = mimetypes.guess_type(filepath)
    response = HttpResponse(path, content_type=mime_type)
    response['Content-Disposition'] = "attachment; filename=%s" % filename
    return response


def update_certs(request):
    filepath = 'orccerts/Files/Jsons/'
    download_certs(2022, filepath, False)
    return HttpResponse("Done")


def target_time_page(request, filename=''):
    return render(request, 'file.html')
