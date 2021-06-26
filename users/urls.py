from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", auth_views.LoginView.as_view(template_name="users/login.html"), name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("profile/", views.profile, name="profile"),
    path("profile/request", views.friend_request, name="friend-request"),
    path("profile/accept", views.friend_accept, name="friend-accept"),
    path("profile/reject", views.friend_reject, name="friend-reject"),
    path("profile/unfriend", views.unfriend, name="unfriend"),
    path("password-reset/", auth_views.PasswordResetView.as_view(template_name="users/password_reset.html", 
         email_template_name='users/password_reset_mail.txt'), name="password_reset"),
    path("password-reset/done/", auth_views.PasswordResetDoneView.as_view(template_name="users/password_reset_done.html"),
         name="password_reset_done"),
    path("password-reset-confirm/<uidb64>/<token>/",
         auth_views.PasswordResetConfirmView.as_view(template_name="users/password_reset_confirm.html"),
         name="password_reset_confirm"),
    path("password-reset-complete/", auth_views.PasswordResetCompleteView.as_view(template_name="users/password_reset_complete.html"),
         name="password_reset_complete"),
]