from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    friends = models.ManyToManyField("self", blank=True)
    cheater = models.BooleanField(default=False)


    def __str__(self):
        return f'{self.username}'


class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="from_requests")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="to_requests")

    class Meta:
        unique_together = ('to_user', 'from_user')
    
    def accept(self):
        self.from_user.friends.add(self.to_user)
        self.delete()

    def reject(self):
        self.delete()
