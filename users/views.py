from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.exceptions import ValidationError
from .forms import UserRegisterForm, UserUpdateForm, SendFriendRequestForm, AcceptRejectForm, UnfriendForm
from django.contrib.auth.decorators import login_required
from .models import FriendRequest, User
from django.contrib.auth import login, logout


def register(request):
    """Register new users and send verification mails to their email addresses."""
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():           
            user = form.save(commit=False)  # add all information from the form in the User model
            user.save()  # save the User model 
            login(request, user)  # log the user in
            messages.add_message(request, messages.SUCCESS, f'Your account was successfully activated.')
            return redirect("profile")
        else:
            return render(request, 'users/register.html', {'form': form})

    return render(request, 'users/register.html', {'form': UserRegisterForm()})

@login_required
def logout_view(request):
    logout(request)
    messages.add_message(request, messages.SUCCESS, "You were logged out")
    return redirect("login")

@login_required
def profile(request):
    username = request.user.username
    if request.method == "POST":
        u_form = UserUpdateForm(request.POST, instance=request.user)
        if u_form.is_valid():
            u_form.save()
            messages.success(request, "Your account has been updated!")
            return redirect("profile")

    else:
        u_form = UserUpdateForm(instance=request.user)

    context = {
        "u_form": u_form,
    }

    context["friend_request_form"] = SendFriendRequestForm()
    context["friend_requests"] = FriendRequest.objects.filter(to_user=request.user)
    context["accept_reject_form"] = AcceptRejectForm()
    context["unfriend_form"] = UnfriendForm()
    context["username"] = username

    return render(request, 'users/profile.html', context)


@login_required
def friend_request(request):
    if request.method == "POST":
        send_request_form = SendFriendRequestForm(request.POST)
        if send_request_form.is_valid():
            to_user = User.objects.filter(username=send_request_form.cleaned_data["username"])
            if len(to_user) == 0:
                messages.error(request, "The username did not exist. Make sure you type the name correctly.")
            else:
                friend_request = FriendRequest(from_user=request.user, to_user=to_user[0])

                try:
                    friend_request.validate_unique()
                    if friend_request.from_user != friend_request.to_user and \
                            friend_request.to_user not in friend_request.from_user.friends.all():
                        friend_request.save()
                        messages.success(request, "Friend request sent.")
                    else:
                        messages.error(request, "You can't send a friend request to this person.")
                except ValidationError:
                    messages.error(request, """You already sent a friend request to this person or 
                                            this person already sent one to you.""")

    return redirect("profile")


@login_required
def friend_accept(request):
    if request.method == "POST":
        accept_form = AcceptRejectForm(request.POST)
        if accept_form.is_valid():
            friend_request = FriendRequest.objects.filter(pk=accept_form.cleaned_data["pk_value"])
            if len(friend_request) == 0:
                messages.error(request, "Friend request doesn't exist.")
            elif friend_request[0].to_user != request.user:
                messages.error(request, "Accepting a request for another user is not allowed.")
            else:
                friend_request[0].accept()
                messages.success(request, "Request accepted.")
        else:
            messages.error(request, "An error occurred.")

    return redirect("profile")


@login_required
def friend_reject(request):
    if request.method == "POST":
        accept_form = AcceptRejectForm(request.POST)
        if accept_form.is_valid():
            friend_request = FriendRequest.objects.filter(pk=accept_form.cleaned_data["pk_value"])
            if len(friend_request) == 0:
                messages.error(request, "Friend request doesn't exist.")
            elif friend_request[0].to_user != request.user:
                messages.error(request, "Rejecting a request for another user is not allowed.")
            else:
                friend_request[0].reject()
                messages.success(request, "Request rejected.")
        else:
            messages.error(request, "An error occurred.")

    return redirect("profile")

@login_required
def unfriend(request):
    if request.method == "POST":
        unfriend_form = UnfriendForm(request.POST)
        if unfriend_form.is_valid():
            friend = User.objects.filter(username=unfriend_form.cleaned_data["username"])
            if len(friend) == 0:
                messages.error(request, "Username doesn't exist.")
            else:
                friend = request.user.friends.all().filter(username=friend[0].username)
                if len(friend) == 0:
                    messages.error(request, "You can't unfriend a friend you don't have")
                else:
                    request.user.friends.remove(friend[0])
        else:
            messages.error(request, "An error occurred.")

    return redirect("profile")
