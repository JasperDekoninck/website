from django.urls import path
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    path("", view=views.home_view, name="games-home"),
    path("highscores/", view=views.GeneralHighscoreView().as_view(), name="highscore"),
    path("<str:title>/", view=views.GameOverview.as_view(), name="game-overview"),
    path("unity/<str:title>/", view=views.UnityGameOverview.as_view(), name="unity-game-overview"),
    path("<str:game_title>/<str:title>/", view=views.VariantView.as_view(), name="games"),
    path("<str:game_title>/<str:title>/save_not_login", view=views.SaveNotLoginView.as_view(), name="save_not_login"),
    path("<str:game_title>/<str:title>/<str:token>/save_not_login", 
          view=login_required(views.SaveNotLoginSaveView.as_view()), name="save_not_login_save"),
]