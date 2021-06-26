from django.contrib import admin
from .models import News 


class CustomNewsAdmin(admin.ModelAdmin):
    """
    A model to display news correctly.
    """
    model = News

    # the fields to show in the Django admin
    fieldsets = (
        (None, {'fields': ('title', 'description', 'image', "inactive")}),
        ("Relation", {"fields": ("object_id", "content_type", "button_text")}), 
        ("Dates", {"fields": ("created_at", "updated_at")}),
    )

    # you can search news by title
    search_fields = ('title',)

    # set ordering such that the most recent news comes first
    ordering = ('-created_at', )


# Register your models here.
admin.site.register(News, CustomNewsAdmin)