from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Student, Placement, Event, Competition, PlacementRegistration, EventRegistration
from .serializers import StudentSerializer, PlacementSerializer, EventSerializer, PlacementRegistrationSerializer, EventRegistrationSerializer, CompetitionSerializer
from .utils.emails import send_welcome_email, send_event_registration_email, send_placement_registration_email

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def perform_create(self, serializer):
        student = serializer.save()
        # Send welcome email
        if student.email:
             send_welcome_email(student.email, student.name)

    @action(detail=False, methods=['post'])
    def login(self, request):
        register_number = request.data.get('register_number')
        password = request.data.get('password')
        try:
            student = Student.objects.get(register_number=register_number)
            if student.password_hash == password: # Simple plain text for now
                serializer = self.get_serializer(student)
                return Response(serializer.data)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        except Student.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class PlacementViewSet(viewsets.ModelViewSet):
    queryset = Placement.objects.all()
    serializer_class = PlacementSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.all()
    serializer_class = CompetitionSerializer

class PlacementRegistrationViewSet(viewsets.ModelViewSet):
    queryset = PlacementRegistration.objects.all()
    serializer_class = PlacementRegistrationSerializer

    def create(self, request, *args, **kwargs):
        # Custom create to check duplicates
        student_id = request.data.get('student')
        placement_id = request.data.get('placement')
        role_name = request.data.get('role_name')
        
        if PlacementRegistration.objects.filter(student_id=student_id, placement_id=placement_id, role_name=role_name).exists():
             return Response({'error': 'Already registered'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = super().create(request, *args, **kwargs)
        
        # Send confirmation email
        try:
            student = Student.objects.get(id=student_id)
            placement = Placement.objects.get(id=placement_id)
            if student.email:
                send_placement_registration_email(student.email, placement.company_name, placement.date)
        except Exception as e:
            print(f"Error sending placement email: {e}")
            
        return response

class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer

    def create(self, request, *args, **kwargs):
        # Custom create to check duplicates
        student_id = request.data.get('student')
        competition_id = request.data.get('competition')
        
        if EventRegistration.objects.filter(student_id=student_id, competition_id=competition_id).exists():
             return Response({'error': 'Already registered for this competition'}, status=status.HTTP_400_BAD_REQUEST)
        
        response = super().create(request, *args, **kwargs)
        
        # Send confirmation email
        try:
            student = Student.objects.get(id=student_id)
            competition = Competition.objects.get(id=competition_id)
            event = competition.event
            if student.email:
                send_event_registration_email(student.email, f"{event.event_name} - {competition.name}", event.date)
        except Exception as e:
            print(f"Error sending event email: {e}")
            
        return response
