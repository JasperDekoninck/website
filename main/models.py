from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType


class Project(models.Model):
    """
    Base model for projects (random, game, math, ...)
    """
    title = models.CharField(max_length=255)
    description = models.TextField() 

    class Meta:
        abstract = True

    def get_absolute_url():
        return ""


class News(models.Model):
    # self explanatory
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(default="defaultNews.png", upload_to='news_pics')
    created_at = models.DateTimeField(blank=True)
    updated_at = models.DateTimeField(blank=True)
    inactive = models.BooleanField(default=False)
    # add possibility for the buttons going to the project pages using GenericForeignKey.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, default=None)
    object_id = models.PositiveIntegerField(blank=True, null=True, default=None)
    project = GenericForeignKey("content_type", "object_id")
    button_text = models.CharField(max_length=255, blank=True, null=True, default=None)

    class Meta:
        # changing the name of the Articles
        verbose_name = "Article"
        verbose_name_plural = "News"

    def save(self, *args, **kwargs):
        # Overwriting is to set the created_at option
        if not self.created_at:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        output = super(News, self).save(*args, **kwargs)

        return output

    def __str__(self):
        return self.title
