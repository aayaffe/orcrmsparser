import mimetypes
import os
import sys

from django.http import HttpResponse, FileResponse
from django.shortcuts import render
sys.path.append(os.getcwd() + '/..')
from targettime import generate_target_time_file


def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")


def download_target_time_file(request):
    filepath = 'orccerts/Files/target_time.xlsx'
    jsons = ['orccerts/Files/Jsons/ISR_ORC.json', 'orccerts/Files/Jsons/ISR_NS.json']
    generate_target_time_file(filepath, jsons)
    filename = 'target_time.xlsx'
    path = open(filepath, 'rb')
    mime_type, _ = mimetypes.guess_type(filepath)
    response = HttpResponse(path, content_type=mime_type)
    response['Content-Disposition'] = "attachment; filename=%s" % filename
    return response


def target_time_page(request, filename=''):
    return render(request, 'file.html')