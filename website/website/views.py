import os
import sys

from django.shortcuts import render
sys.path.append(os.getcwd() + '/..')


def index(request):
    return render(request, 'index.html')
