import mimetypes
import os
import sys

from django.http import HttpResponse
from django.shortcuts import render
from django.views import generic

sys.path.append(os.getcwd() + '/..')
from targettime import generate_target_time_file
from certs_downloader import download_certs

from django.http import HttpResponseRedirect
from django.shortcuts import render

from .forms import NameForm


from . import forms, models


class BookCreateView(generic.CreateView):
    model = models.Person
    form_class = forms.BookForm
    success_url = "/"

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


def get_name(request):
    # if this is a POST request we need to process the form data
    if request.method == 'POST':
        # create a form instance and populate it with data from the request:
        form = NameForm(request.POST)
        # check whether it's valid:
        if form.is_valid():
            # process the data in form.cleaned_data as required
            # ...
            # redirect to a new URL:
            return HttpResponseRedirect('/thanks/')

    # if a GET (or any other method) we'll create a blank form
    else:
        form = NameForm()

    return render(request, 'name.html', {'form': form})
