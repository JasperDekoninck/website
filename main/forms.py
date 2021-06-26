from django import forms


class ContactForm(forms.Form):

    # Name of the user that wants to contact me
    name = forms.CharField(max_length=255, required=True)

    # email address in contact form
    email = forms.EmailField(help_text="If you want/except an answer back, you will need to supply your email address.", 
                                required=False)

    # the message of the User
    message = forms.CharField(widget=forms.Textarea, required=True)
