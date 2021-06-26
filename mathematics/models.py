from django.db import models
from PIL import Image
from django.urls import reverse
from main.models import Project


class MathProject(Project):
    file = models.FileField(default=None, upload_to="mathpapers", blank=True, null=True)
    image = models.ImageField(default=None, upload_to='math_pics', blank=True, null=True)

    def __str__(self):
        return self.title
