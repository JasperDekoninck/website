from django.urls import path
from . import views

urlpatterns = [
    path("", view=views.home_view, name="random_projects-home"),
    path("<str:title>/", view=views.ProjectView.as_view(), name="random_projects-project")
]
