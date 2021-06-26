from django.core.checks import messages
from django.http.request import HttpRequest
from django.shortcuts import render, HttpResponse, redirect
from .models import Game, UnityGame, GameVariant, Score, InitialScore, SemiScore
from django.views.generic import DetailView
from django.http import HttpRequest
from .forms import ScoreForm, ScoreVariantForm
from django.urls import reverse
from .models import Score
from users.models import User
import json


def home_view (request):
    all_games = Game.objects.all().order_by(("title"))
    return render(request, 'games/main.html', {"games": all_games,
                  "image_background_source": "/media/background_games.png",
                  "image_background_text": "Games",
                  "description": "An overview of all games on this sites",
                  "keywords": "Games, Jasper Dekoninck",
                  "title": "Games"})


class GameOverview(DetailView):
    model = Game
    template_name = 'games/game_overview.html'
    slug_field = 'title'
    slug_url_kwarg = 'title'

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        context['variants'] = self.object.gamevariant_set.all()
        context["description"] = self.get_object().description
        context["keywords"] = f"Games, Jasper Dekoninck, {self.get_object().title}"
        context["title"] = self.get_object().title
        context["unity"] = False
        return context


class UnityGameOverview(DetailView):
    model = UnityGame
    template_name = 'games/game_overview.html'
    slug_field = 'title'
    slug_url_kwarg = 'title'

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super().get_context_data(**kwargs)
        context["description"] = self.get_object().description
        context["keywords"] = f"Games, Jasper Dekoninck, {self.get_object().title}"
        context["title"] = self.get_object().title
        context["unity"] = True
        print(context)
        return context


class VariantView(DetailView):
    model = GameVariant
    slug_field = 'title'
    slug_url_kwarg = 'title'  

    def get_queryset(self):
        # gets the correct game variant based on the url 
        game_variants = GameVariant.objects.filter(title=self.kwargs["title"])
        game = Game.objects.filter(title=self.kwargs["game_title"])[0]
        variant = game_variants.filter(game=game)
        return variant

    def get_context_data(self, **kwargs):
        # some basic context for the view
        context = dict()
        context["description"] = self.get_object().description
        context["keywords"] = f"Games, Jasper Dekoninck, {self.get_object().title}"
        context["title"] = self.get_object().title
        context["variant"] = self.get_object()
        
        return context

    def get(self, request, **kwargs):
        create_initial_score = InitialScore(game_variant=self.get_object())
        create_initial_score.save()
        html = "games/" + self.get_object().html_page
        score_form = ScoreVariantForm(initial={'variant': self.get_object().pk})
        context = self.get_context_data()
        context["highscore_form"] = score_form
        context["token"] = create_initial_score.token
        context["form"] = ScoreForm(initial={"id": create_initial_score.token})

        return render(request, html, context)

    def post(self, request, **kwargs):
        form = ScoreForm(request.POST)
        msg = "failed"
        if form.is_valid() and request.user.is_authenticated:
            filtered_initial_scores = InitialScore.objects.filter(token=form.cleaned_data["id"])
            if len(filtered_initial_scores) > 0:
                msg = "success"
                # save the score if there is a post on this kind of view
                score = Score(score=form.cleaned_data["score"], game_variant=self.get_object(),
                              user=request.user, creation_date=filtered_initial_scores[0].creation_date, 
                              token=filtered_initial_scores[0].token)
                score.save()
                filtered_initial_scores[0].delete()
            else:
                filtered_scores = Score.objects.filter(token=form.cleaned_data["id"])
                if len(filtered_scores) > 0:
                    filtered_scores[0].cheated = True
                    filtered_scores[0].save()

        return HttpResponse(json.dumps({"msg": msg}), content_type="application/json")


class SaveNotLoginView(DetailView):
    """A view for users that weren't logged in but want to save there score"""
    model = GameVariant
    slug_field = 'title'
    slug_url_kwarg = 'title'

    def get_queryset(self):
        # gets the correct variant for which the user wants to save the score 
        game_variants = GameVariant.objects.filter(title=self.kwargs["title"])
        game = Game.objects.filter(title=self.kwargs["game_title"])[0]
        variant = game_variants.filter(game=game)
        return variant

    def get(self, request, **kwargs):
        # redirects to the game if it is just a get post
        return redirect(reverse("games", 
                                kwargs={"title": self.kwargs["title"], "game_title": self.kwargs["game_title"]}))

    def post(self, request, **kwargs):
        # if it is a post, then create a semi-score that is stored so that the user can login if the form is valid
        form = ScoreForm(request.POST)
        if form.is_valid():
            filtered_initial_scores = InitialScore.objects.filter(token=form.cleaned_data["id"])
            if len(filtered_initial_scores) > 0:
                semi_score = SemiScore(score=form.cleaned_data["score"], game_variant=self.get_object(), 
                                       token_score=filtered_initial_scores[0].token, 
                                       creation_date=filtered_initial_scores[0].creation_date)
                semi_score.save()
                context = {"title": semi_score.game_variant.title, "game_title": semi_score.game_variant.game.title, 
                        "token": semi_score.token}
                # redirect to save_not_login_save
                filtered_initial_scores[0].delete()
                return redirect(reverse("save_not_login_save", kwargs=context))

        return self.get(request)


class SaveNotLoginSaveView(DetailView):
    """the stored semi score is explicitly saved with this view if the user """
    model = SemiScore
    slug_field = 'token'
    slug_url_kwarg = 'token'

    def get(self, request, **kwargs):
        context = dict()
        # this is just an extra precaution, that shouldn't be necessary as login is required (see views)
        if request.user.is_authenticated:
            # create the score based on the given semi-score
            score = Score(score=self.get_object().score, game_variant=self.get_object().game_variant, 
                          user=request.user, 
                          creation_date=self.get_object().creation_date, exit_date=self.get_object().exit_date, 
                          token=self.get_object().token_score)

            if not self.get_object().used:
                score.save()

            self.get_object().used = True
            context["score"] = score.score
            context["variant"] = score.game_variant.pk

        new_redirect = HttpRequest()
        new_redirect.method = "POST"
        new_redirect.user = request.user
        new_redirect.POST = context
        return GeneralHighscoreView().as_view()(new_redirect)


class GeneralHighscoreView:
    template_name = 'games/highscore.html'

    def as_view(self):
        def view(request):
            if request.method == "POST":
                return self.post(request)
            else:
                return self.get(request)

        return view

    @staticmethod
    def create_context_users_variant(request, users, variant, score_user, score_variant):
        context = dict()
        top_scores_variant_unique = []
        top_scores_variant = []
        # get the Number 1 top score of each player for the variant
        for user in users:
            if variant.goal_game == "min":
                scores_user_variant = user.score_set.filter(game_variant=variant).order_by("score")
            else:
                scores_user_variant = user.score_set.filter(game_variant=variant).order_by("-score")
            
            top_scores_variant.extend(scores_user_variant)
            if len(scores_user_variant) > 0:
                top_scores_variant_unique.append(scores_user_variant[0])

        # get all scores and unique-per-user scores sorted in the correct way
        if variant.goal_game == "min":
            context['top_scores'] = sorted(top_scores_variant, key=lambda x: x.score)
            context["top_scores_unique"] = sorted(top_scores_variant_unique, key=lambda x: x.score)
        else:
            context['top_scores'] = sorted(top_scores_variant, key=lambda x: - x.score)
            context["top_scores_unique"] = sorted(top_scores_variant_unique, key=lambda x: - x.score)

        # get the scores for the user in this variant and their place in all scores
        user_scores_variant = [(i + 1, score) for i, score in enumerate(context['top_scores'])
                                if score.user == request.user]

        # get the top score of the user for this variant and its place: note this is a list of one element
        # (makes things easier)
        user_unique_scores_variant =  [(i + 1, score) 
                                        for i, score in enumerate(context["top_scores_unique"])
                                        if score.user == request.user]

        context["top_scores_user"] = user_scores_variant
        context["top_scores_unique_user"] = user_unique_scores_variant

        if score_variant is not None and score_variant.pk == variant.pk:
            # set the place of the current score of the user, set last at first
            context["place_unique"] = len(context["top_scores_unique"]) + 1
            context["place"] = len(context["top_scores"]) + 1

            if score_user is not None:
                # check where it lies in the saved scores
                if score_variant.goal_game == "min":
                    for i, score in enumerate(context["top_scores"]):
                        if score.score >= score_user:
                            context["place"] = i + 1
                            break
                    for i, score in enumerate(context["top_scores_unique"]):
                        if score.score >= score_user:
                            context["place_unique"] = i + 1
                            break
                else:
                    for i, score in enumerate(context["top_scores"]):
                        if score.score <= score_user:
                            context["place"] = i + 1
                            break
                    for i, score in enumerate(context["top_scores_unique"]):
                        if score.score <= score_user:
                            context["place_unique"] = i + 1
                            break

        return context

    def get_context_data(self, request, score_user=None, score_variant=None):
        # gets all scores for all variants sorted such that the highscore view can work
        # Call the base implementation first to get a context

        context = dict()
        context["description"] = "Highscore view for alle games."
        context["keywords"] = f"Games, Jasper Dekoninck, Highscores"
        context["title"] = "Highscores"
        context["games"] = [game for game in Game.objects.all() if len(game.gamevariant_set.filter(has_score=True)) > 0]
        context["game_variants"] = {variant: variant.game for variant in GameVariant.objects.all() if variant.has_score}

        # all the different kind of scores that are possible
        context["top_scores"] = dict()
        context["top_scores_user"] = dict()
        context["top_scores_unique"] = dict()
        context["top_scores_unique_user"] = dict()
        
        context["top_scores_friends_user"] = dict()
        context["top_scores_unique_friends"] = dict()
        context["top_scores_unique_friends_user"] = dict()
        context["top_scores_friends"] = dict()

        # for each variant we need to fill in all of the 8 above scores
        for game in context["games"]:
            for variant in game.gamevariant_set.filter(has_score=True):
                # calculate the scores and set them correctly
                context_variant_user = self.create_context_users_variant(request, 
                                    User.objects.filter(cheater=False).union(User.objects.filter(pk=request.user.pk)), 
                                                                            variant, score_user, score_variant)
                context['top_scores'][variant] = context_variant_user["top_scores"]
                context["top_scores_unique"][variant] = context_variant_user["top_scores_unique"]

                context["top_scores_user"][variant] = context_variant_user["top_scores_user"]
                context["top_scores_unique_user"][variant] = context_variant_user["top_scores_unique_user"]

                if context_variant_user.get("place") is not None:
                    context["place"] = context_variant_user["place"]
                    context["place_unique"] = context_variant_user["place_unique"]

                if request.user.is_authenticated:
                    # calculate the scores and set them correctly
                    friends = request.user.friends.all() | User.objects.filter(pk=request.user.pk)
                    context_variant_user_friends = self.create_context_users_variant(request, friends, variant, 
                                                                            score_user, score_variant)

                    context['top_scores_friends'][variant] = context_variant_user_friends["top_scores"]
                    context["top_scores_unique_friends"][variant] = context_variant_user_friends["top_scores_unique"]

                    context["top_scores_friends_user"][variant] = context_variant_user_friends["top_scores_user"]
                    context["top_scores_unique_friends_user"][variant] = \
                                                    context_variant_user_friends["top_scores_unique_user"]

                    if context_variant_user_friends.get("place") is not None:
                        context["place_friends"] = context_variant_user_friends["place"]
                        context["place_unique_friends"] = context_variant_user_friends["place_unique"]

        context["user_score"] = score_user
        context["score_variant"] = score_variant
        context['top_scores'] = {k: list(v)[:10] for k, v in context["top_scores"].items()}

        context["top_scores_unique"] = {k: list(v)[:10] for k, v in context["top_scores_unique"].items()}

        return context

    def get(self, request, **kwargs):
        context = self.get_context_data(request)

        return render(request, self.template_name, context)

    def post(self, request, **kwargs):
        form = ScoreVariantForm(request.POST)
        if form.is_valid():
            score_variant = GameVariant.objects.filter(pk=form.cleaned_data["variant"])
            if len(score_variant) == 0:
                return self.get(request, **kwargs)

            context = self.get_context_data(request, form.cleaned_data["score"], score_variant[0])

            return render(request, self.template_name, context)

        return self.get(request, **kwargs)
