from django.contrib import admin
from .models import Game, Score, GameVariant, UnityGame

admin.site.register(Game)
admin.site.register(GameVariant)
admin.site.register(Score)
admin.site.register(UnityGame)
