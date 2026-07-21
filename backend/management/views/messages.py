from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.serializers import ModelSerializer
from management.models import Message, Client
from django.db.models import Max, Q

from rest_framework import serializers

class MessageSerializer(serializers.ModelSerializer):
    reply_to_details = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender_type', 'staff_sender', 'is_read']

    def get_reply_to_details(self, obj):
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.content,
                'sender_type': obj.reply_to.sender_type,
            }
        return None

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().select_related('client', 'staff_sender')
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Staff can see all messages, but they usually want to filter by client
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(sender_type='Staff', staff_sender=self.request.user)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """
        Returns a list of clients who have messages, annotated with their latest message details
        and unread counts.
        """
        clients = Client.objects.filter(messages__isnull=False).distinct()
        
        data = []
        for client in clients:
            latest_message = Message.objects.filter(client=client).order_by('-created_at').first()
            unread_count = Message.objects.filter(client=client, sender_type='Client', is_read=False).count()
            
            data.append({
                'client_id': client.id,
                'client_name': client.name,
                'latest_message': latest_message.content if latest_message else '',
                'latest_message_time': latest_message.created_at if latest_message else None,
                'unread_count': unread_count,
            })
            
        data.sort(key=lambda x: x['latest_message_time'] or '', reverse=True)
        return Response(data)

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        client_id = request.data.get('client_id')
        if client_id:
            Message.objects.filter(client_id=client_id, sender_type='Client', is_read=False).update(is_read=True)
            return Response({'status': 'marked as read'})
        return Response({'error': 'client_id required'}, status=status.HTTP_400_BAD_REQUEST)

class ClientPortalMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'client_profile') or not user.client_profile:
            return Response({"error": "Only clients can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        client = user.client_profile
        messages = Message.objects.filter(client=client).order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        
        # Mark staff messages as read when client fetches them
        Message.objects.filter(client=client, sender_type='Staff', is_read=False).update(is_read=True)
        
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        if not hasattr(user, 'client_profile') or not user.client_profile:
            return Response({"error": "Only clients can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        client = user.client_profile
        content = request.data.get('content')
        reply_to_id = request.data.get('reply_to')
        
        if not content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        message = Message.objects.create(
            client=client,
            sender_type='Client',
            content=content,
            reply_to_id=reply_to_id
        )
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
