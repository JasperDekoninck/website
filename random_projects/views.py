from django.shortcuts import render
from django.views.generic import DetailView
from .models import RandomProject
from .forms import WeatherCityForm
import requests, json
from django.contrib import messages
import os


def home_view (request):
    context = {"projects": RandomProject.objects.all().order_by("title"), 
                "image_background_source": "/media/random.jpg", "image_background_text": "Random", 
                "description": "Random projects about things I like, for example genetic flappy bird and Mandelbrot.", 
                "keywords": "Random, Jasper Dekoninck, Flappy bird, Mandelbrot", 
                "title": "Random"}
    return render(request, 'random_projects/main.html', context)


class ProjectView(DetailView):
    model = RandomProject
    slug_field = 'title'
    slug_url_kwarg = 'title'

    def get_context_data(self, **kwargs):
        context = dict()
        context["description"] = self.get_object().description
        context["keywords"] = f"Random, Jasper Dekoninck, {self.get_object().title}", 
        context["title"] = self.get_object().title
        context["project"] = self.get_object()
        if self.model.weather:
            context["weather_form"] = WeatherCityForm()
        return context

    def post(self, request, **kwargs):
        context = self.get_context_data()
        if self.model.weather:
            form = WeatherCityForm(request.POST)
            if form.is_valid():
                city = form.cleaned_data["city"]
                context["city"] = city
                API = os.getenv("API_WEATHER", None)
                url_weather= f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API}"
                get = requests.get(url_weather)

                if get.status_code == 404:
                    messages.error(request, "City not found.")
                elif get.status_code == 429:
                    messages.error(request, "I use a free API that got too many requests, try again later.")
                elif get.status_code != 200:
                    messages.error(request, "An unknown error occurred.")
                else:
                    code = json.loads(get.content.decode("utf-8"))
                    lat, lon = code["coord"]["lat"], code["coord"]["lon"]
                    url2 = f"https://api.openweathermap.org/data/2.5/onecall?lat={lat}&lon={lon}&appid=8c709a0751d2aa872b68303dc79228c1"
                    get2 = requests.get(url2)
                    if get2.status_code == 429:
                        messages.error(request, "I use a free API that got too many requests, try again later.")
                    elif get2.status_code != 200:
                        messages.error(request, "An unknown error occurred.")
                    else:
                        context_weather = json.loads(get2.content.decode("utf-8"))
                        context["weather"] = str(context_weather).replace("'", '"')

        html = "random_projects/" + self.get_object().html_page

        return render(request, html, context)

    def get(self, request, **kwargs):
        html = "random_projects/" + self.get_object().html_page
        return render(request, html, self.get_context_data())
