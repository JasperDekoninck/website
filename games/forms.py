from django import forms


class ScoreForm(forms.Form):
    """Form to send a score without variant"""
    score = forms.FloatField(required=True)
    id = forms.CharField(max_length=255, required=True)

class ScoreVariantForm(forms.Form):
    """Form to send a score about a certain variant"""
    score = forms.FloatField(required=True)
    variant = forms.IntegerField(required=True)  # pk-value variant

class SaveNotLoginForm(forms.Form):
    """form that references the unique id that comes with a save-not-login"""
    token = forms.FloatField(required=True)
