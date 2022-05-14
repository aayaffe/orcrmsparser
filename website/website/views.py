import mimetypes
import os
import sys

from django.http import HttpResponse, FileResponse
from django.shortcuts import render
sys.path.append(os.getcwd() + '/..')
from targettime import generate_target_time_file


def index(request):
    return render(request, 'index.html')
