from django.db import models
from main.models import Project
from PIL import Image
from django.urls import reverse

# Create your models here.
class RandomProject(Project):
    html_page = models.CharField(max_length=255, default="")
    image = models.ImageField(default=None, upload_to='random_pics', blank=True)
    weather = models.BooleanField(default=False)

    def get_absolute_url(self):
        return reverse("random_projects-project", kwargs={"title": self.title})

    def __str__(self):
        return self.title
