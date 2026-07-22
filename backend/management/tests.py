from django.test import TestCase
from management.serializers.public import PublicHearingSerializer

class PublicHearingAPITests(TestCase):
    def test_public_serializer_field_allowlist(self):
        """
        Ensures the PublicHearingSerializer strictly uses an allowlist.
        If a new sensitive field is added to the Hearing model, this serializer
        will NOT automatically include it unless explicitly added to this list.
        """
        fields = set(PublicHearingSerializer().get_fields().keys())
        expected_fields = {'id', 'case_title', 'court_name', 'judge', 'date', 'time', 'status'}
        self.assertEqual(fields, expected_fields)
