from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('targettime/file', views.download_target_time_file),
    path('targettime/', views.target_time_page),
]