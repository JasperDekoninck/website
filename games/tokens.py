from django.contrib.auth.tokens import PasswordResetTokenGenerator


class ScoreTokenGenerator(PasswordResetTokenGenerator):
    """Token generateor for the semi-score such that the user can save a score when he/she is not logged in"""
    def _make_hash_value(self, semi_score, timestamp):
        return (
            str(semi_score.pk) + str(timestamp) +
            str(semi_score.score)
        )

class InitialScoreTokenGenerator(PasswordResetTokenGenerator):
    """Token generateor for the initial-score such that the user can save a score when he/she is not logged in"""
    def _make_hash_value(self, initial_score, timestamp):
        return (
            str(initial_score.pk) + str(timestamp)
        )

score_token_generator = ScoreTokenGenerator()
initial_token_generator = InitialScoreTokenGenerator()
