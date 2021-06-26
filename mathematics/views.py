from django.shortcuts import render
from .models import MathProject


def home_view(request):
    return render(request, "mathematics/main.html", {"projects": MathProject.objects.all().order_by("title"),
                "image_background_source": "/media/equations.png", "image_background_text": "Mathematics"})

