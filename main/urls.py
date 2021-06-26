from django.urls import path
from . import views

urlpatterns = [
    path('', view=views.home_view, name="home"),
    path("news/", view=views.NewsListView.as_view(), name="news"), 
    path("contact/", view=views.contact_view, name="contact")
]
