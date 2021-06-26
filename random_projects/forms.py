from django import forms

class WeatherCityForm(forms.Form):
    city = forms.CharField(max_length=220)
    