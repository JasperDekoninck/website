from django import forms
from django.core.exceptions import ValidationError
from .models import User
from django.contrib.auth.password_validation import validate_password
from crispy_forms.helper import FormHelper


class UserRegisterForm(forms.ModelForm):
    """
    A form that creates a user, with no privileges, from the given username and
    password.
    """
    error_messages = {
        'password_mismatch': "The two password fields didn't match.",
    }

    username = forms.CharField(label="Username",
                               help_text="150 characters or fewer. Letters, digits and @/./+/-/_ only.", 
                               required=True, max_length=150)

    email = forms.EmailField(label="Email", required=True, 
                             help_text="""I ask for an email address in case you forget your password. This email address
                             won't be used for anything else.""")

    password1 = forms.CharField(label="Password",
                                widget=forms.PasswordInput, help_text="""<ul>
                                <li>Your password can’t be too similar to your other personal information.</li>
                                <li>Your password must contain at least 8 characters. </li>
                                <li>Your password can’t be a commonly used password. </li>
                                <li>Your password can’t be entirely numeric. </li>
                                </ul>""", required=True, min_length=8)

    password2 = forms.CharField(label="Password confirmation",
                                widget=forms.PasswordInput,
                                help_text="Enter the same password as above, for verification."
                                , required=True, min_length=8)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_id = 'register-form'
        self.helper.form_class = ''

    class Meta:
        model = User
        fields = ("username", "email")

    def clean_password2(self):
        """make sure passwords match"""
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError(
                self.error_messages['password_mismatch'],
                code='password_mismatch',
            )
        return password2

    def clean_username(self):
        return self.cleaned_data["username"]

    def clean_email(self):
        return self.cleaned_data["email"]

    def clean_password1(self):
        user = User(username=self.cleaned_data["username"], email=self.cleaned_data["email"])
        try:
            validate_password(self.cleaned_data.get("password1"), user=user)
        except ValidationError as e:
            raise forms.ValidationError(e)
        return self.cleaned_data.get("password1")

    def save(self, commit=True):
        user = super(UserRegisterForm, self).save(commit=False)
        
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserUpdateForm(forms.ModelForm):
    username = forms.CharField(label="Username",
                               help_text="", 
                               required=True, max_length=150)
    class Meta:
        model = User
        fields = ['username', 'email']


class SendFriendRequestForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)


class AcceptRejectForm(forms.Form):
    pk_value = forms.IntegerField() 


class UnfriendForm(forms.Form):
    username = forms.CharField(max_length=150, required=True)
