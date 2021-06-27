from django.shortcuts import render
from .models import News
from django.views.generic import ListView
from .forms import ContactForm
from django.core.mail import send_mail
from django.contrib import messages
from smtplib import SMTPException
import os


# Create your views here.
def home_view (request):
    context = {"news": list(News.objects.filter(inactive=False).order_by("-created_at"))[:3], 
                "description": "A site where some projects are showcased about AI, games and mathematics", 
                "keywords": "Games, AI, Mathematics, Random, Jasper Dekoninck, Home", 
                "title": "Home", 
                "image_background_source": "/media/Background.jpg", 
                "image_background_text": "Welcome"}
    return render(request, 'main/main.html', context)

def contact_view(request):
    context = {"description": "A page to contact me", 
                "keywords": "Jasper Dekoninck, Contact", 
                "title": "Contact"}

    # POST to Contact -> form filled in thus send mail if valid contact form
    if request.method == "POST":
        contact_form = ContactForm(request.POST)
        if contact_form.is_valid():
            # Send the mail, from myself to myself with subject containing information on who to send back to.
            try: 
                send_mail(
                        f'MESSAGE FROM {contact_form.cleaned_data["name"]}, EMAIL {contact_form.cleaned_data["email"]}',
                        contact_form.cleaned_data["message"],
                        os.getenv("MY_EMAIL", None),
                        [os.getenv("MY_EMAIL", None)],
                        fail_silently=False,
                )
                messages.add_message(request, messages.SUCCESS, "Message successfully sent")
            except SMTPException:
                messages.add_message(request, messages.ERROR, """
                                You message didn't get through. 
                                Try to contact me later or send me an email to """ + os.getenv("MY_EMAIL", ""))

        else:
            # contact form invalid.
            messages.add_message(request, messages.ERROR, "Contact form was invalid")
            context["contact_form"] = contact_form
        
    # automatically fill in name and name if user is logged in
    if request.user.is_authenticated and context.get("contact_form") is None:
        context["contact_form"] = ContactForm(initial={"email": request.user.email, "name": request.user.username})
    elif context.get("contact_form") is None: 
        context["contact_form"] = ContactForm()

    return render(request, "main/contact.html", context)


class NewsListView(ListView):
    """
    View of all News articles
    """
    model = News
    template_name = 'main/news.html'
    context_object_name = 'news'
    # most recent first
    ordering = ['-created_at']
    paginate_by = 5

    def get_queryset(self):
        new_context = News.objects.filter(inactive=False).order_by(self.ordering[0])
        return new_context

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["description"] = "News updates about the developments on this site"
        context["keywords"] = "Games, AI, Mathematics, Random, Jasper Dekoninck, News"
        context["title"] = "News"
        return context


def handler404(request, exception):
    """
    Handler for a 404 - not found exception
    """
    context = {
        "description": "404 page", 
        "keywords": "404", 
        "title": "404", 
        "status": 404
    }
    return render(request, 'main/error_view.html', context=context, status=404)

def handler500(request):
    """
    Handler for a 500 - server side exception
    """
    context = {
        "description": "500 page", 
        "keywords": "500", 
        "title": "500", 
        "status": 500
    }
    return render(request, 'main/error_view.html', context=context, status=500)


def handler400(request, exception):
    """
    Handler for a 400 - bad request error
    """
    context = {
        "description": "400 page", 
        "keywords": "400", 
        "title": "400", 
        "status": 400
    }
    return render(request, 'main/error_view.html', context=context, status=400)


def handler403(request, exception):
    """
    Handler for a 403 - forbidden error
    """
    context = {
        "description": "403 page", 
        "keywords": "403", 
        "title": "403", 
        "status": 403
    }
    return render(request, 'main/error_view.html', context=context, status=403)
