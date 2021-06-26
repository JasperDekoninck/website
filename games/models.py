from django.utils import timezone
from django.db import models
from users.models import User
from main.models import Project
from django.urls import reverse
from PIL import Image
from .tokens import score_token_generator, initial_token_generator


class Game(Project):
    """Game model"""
    how_to = models.TextField()  # how to play the game
    image = models.ImageField(default="defaultGame.png", upload_to='game_pics')  # image of the game
    unity = models.BooleanField(default=False)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """Saves the game, but resizes the given image to make it match all other images"""
        super().save(force_insert, force_update, using, update_fields)
        img = Image.open(self.image.path)
        output_size = (1920, 1080)
        img.thumbnail(output_size, Image.ANTIALIAS)
        img.save(self.image.path)

    def get_absolute_url(self):
        if self.unity: 
            return reverse('unity-game-overview', kwargs={"title": self.title})
        return reverse('game-overview', kwargs={"title": self.title})

    def __str__(self):
        return self.title


class UnityGame(Game):
    zip_windows = models.FileField(default=None, blank=True, null=True, upload_to="unity/windows/")
    zip_mac = models.FileField(default=None, blank=True, null=True, upload_to="unity/mac/")
    zip_linux = models.FileField(default=None, blank=True, null=True, upload_to="unity/linux/")
    


class GameVariant(Project):
    """Game variant model"""
    html_page = models.CharField(max_length=255, default="")  # html-page name in the game templates 
    game = models.ForeignKey(Game, on_delete=models.CASCADE)  # the game of the variant
    # the goal of the game: or minimize, or maximize the score
    goal_game = models.CharField(max_length=255, choices=[("min", "minimize"), ("max", "maximize")], default="maximize")
    has_score = models.BooleanField(default=True)
    # image about the variant
    image = models.ImageField(default="defaultGame.png", upload_to='game_pics')

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """Saves the variant, but resizes the given image to make it match all other images"""
        super().save(force_insert, force_update, using, update_fields)
        img = Image.open(self.image.path)
        output_size = (1920, 1080)
        img.thumbnail(output_size, Image.ANTIALIAS)
        img.save(self.image.path)

    def get_absolute_url(self):
        return reverse("games", kwargs={"title": self.title, "game_title": self.game.title})

    def __str__(self):
        return f"{str(self.game)}: {self.title}"


class InitialScore(models.Model):
    creation_date = models.DateTimeField()
    token = models.CharField(max_length=255)
    game_variant = models.ForeignKey(GameVariant, on_delete=models.CASCADE, default=None)
    used = models.BooleanField(default=False)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        self.used = False
        self.creation_date = timezone.now()
        self.token = initial_token_generator.make_token(self)
        super().save(force_insert, force_update, using, update_fields)


class Score(models.Model):
    score = models.FloatField()
    game_variant = models.ForeignKey(GameVariant, on_delete=models.CASCADE, default=None)
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    creation_date = models.DateTimeField(default=None, null=True)
    exit_date = models.DateTimeField(default=None, null=True)
    token = models.CharField(max_length=255, default=None, null=True)
    cheated = models.BooleanField(default=False)

    def save_update_only(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        super().save(force_insert, force_update, using, update_fields)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """saves the score, but ensures that each player has at most 10 scores for each variant,
            deletes the lowest score if this is not the case"""
        if not self.exit_date:  # not saved before
            self.exit_date = timezone.now()
            add = False  # variable that checks whether or not the current score belongs to the top-10 scores of the player
            
            # sort scores of user for the given variant and checks whether or not to add it
            if self.game_variant.goal_game == "min":
                variant_scores_user = self.game_variant.score_set.filter(user=self.user).order_by("score")
                add = len(variant_scores_user) == 0 or self.score < variant_scores_user[len(variant_scores_user) - 1].score
            else:
                variant_scores_user = self.game_variant.score_set.filter(user=self.user).order_by("-score")
                add = len(variant_scores_user) == 0 or self.score > variant_scores_user[len(variant_scores_user) - 1].score

            if len(variant_scores_user) < 10:  # save if there are less then 10 scores
                super().save(force_insert, force_update, using, update_fields)
            elif add:  # saves the score if it needs to be added and deletes the lowest score
                super().save(force_insert, force_update, using, update_fields)
                variant_scores_user[len(variant_scores_user) - 1].delete()
        else: 
            super().save(force_insert, force_update, using, update_fields)
            
        if self.cheated:
            self.user.cheater = True
            self.user.save()

        if self.user.cheater:
            self.cheated = True
            super().save_update_only()
            allScores = list(Score.objects.filter(user=self.user))
            for score in allScores:
                score.cheated = True
                score.save_update_only()
        
    def __str__(self):
        return f"{str(self.game_variant)}: {self.score}"


class SemiScore(models.Model):
    """a semi-score is a score that is saved if the user is not logged in but wants to save his/her score"""
    score = models.FloatField()
    game_variant = models.ForeignKey(GameVariant, on_delete=models.CASCADE, default=None)
    token = models.CharField(default=None, max_length=255)
    used = models.BooleanField(default=False)
    creation_date = models.DateTimeField(default=None, null=True)
    exit_date = models.DateTimeField(default=None, null=True)
    token_score = models.CharField(max_length=255, default=None, null=True)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        self.used = False
        self.exit_date = timezone.now()
        self.token = score_token_generator.make_token(self)  # create unique token such that it is impossible to 
        # recreate this yourself or to generate a fake code
        super().save(force_insert, force_update, using, update_fields)
        
    def __str__(self):
        return f"{str(self.game_variant)}: {self.score}"
