from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import FriendRequest, User


class CustomUserAdmin(UserAdmin):
    """Custom User admin because you want to be able to change friends"""
    model = User
    list_display = ("username", 'email', 'is_staff', 'is_active',)
    list_filter = ("username", 'email', 'is_staff', 'is_active',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ("Personal Info", {"fields": ("email",)}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Friends', {"fields": ("friends", )}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', )}),
        ('Cheater Info', {'fields': ('cheater', )}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('username',)
    ordering = ('username',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(FriendRequest)
