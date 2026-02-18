from rest_framework import serializers
from .models import Student, Placement, Event, Competition, PlacementRegistration, EventRegistration

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {'password_hash': {'write_only': True}}

class PlacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Placement
        fields = '__all__'

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    competitions = CompetitionSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = '__all__'

class PlacementRegistrationSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    placement_details = PlacementSerializer(source='placement', read_only=True)

    class Meta:
        model = PlacementRegistration
        fields = '__all__'

class EventRegistrationSerializer(serializers.ModelSerializer):
    student_details = StudentSerializer(source='student', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)
    competition_details = CompetitionSerializer(source='competition', read_only=True)

    class Meta:
        model = EventRegistration
        fields = '__all__'
