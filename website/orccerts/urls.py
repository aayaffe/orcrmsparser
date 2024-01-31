from django.urls import path, include

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('targettime/file', views.download_target_time_file),
    path('download', views.update_certs),
    path('targettime/', views.target_time_page),
    path('name/', views.get_name),
    path("select2/", include("django_select2.urls")),
    path("book/create", views.BookCreateView.as_view(), name="book-create"),
]