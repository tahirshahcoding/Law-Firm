from rest_framework import serializers
from django.contrib.auth.models import User
from management.models import Court, Judge, Notification, UserProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CourtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Court
        fields = '__all__'

class JudgeSerializer(serializers.ModelSerializer):
    court_name = serializers.CharField(source='court.name', read_only=True)
    class Meta:
        model = Judge
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_or_email = attrs.get('username')
        password = attrs.get('password')

        if username_or_email and password:
            if '@' in username_or_email:
                user_obj = User.objects.filter(email__iexact=username_or_email).first()
                if user_obj:
                    attrs['username'] = user_obj.username
        
        return super().validate(attrs)

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'permissions', 'avatar']

    def get_role(self, obj):
        if hasattr(obj, 'client_profile'):
            return 'Client'
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return 'Staff'

    def get_permissions(self, obj):
        if hasattr(obj, 'client_profile'):
            return {}
        if hasattr(obj, 'profile'):
            return obj.profile.permissions
        return {}

    def get_avatar(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            request = self.context.get('request')
            try:
                if request:
                    return request.build_absolute_uri(obj.profile.avatar.url)
                from django.conf import settings
                media_url = getattr(settings, 'MEDIA_URL', '/media/')
                return f"{media_url}{obj.profile.avatar}"
            except Exception:
                return None
        return None
