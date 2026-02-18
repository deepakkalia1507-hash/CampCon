from django.db import models
from django.contrib.auth.models import User

# User/Student Model
class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    register_number = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    student_class = models.CharField(max_length=50) # 'class' is reserved
    department = models.CharField(max_length=100)
    year = models.CharField(max_length=10)
    college = models.CharField(max_length=255)
    cgpa = models.CharField(max_length=10, blank=True, null=True)
    backlogs = models.CharField(max_length=10, blank=True, null=True)
    history_of_arrears = models.CharField(max_length=10, blank=True, null=True)
    tenth_marks = models.CharField(max_length=10, blank=True, null=True)
    twelfth_marks = models.CharField(max_length=10, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True) # For simple auth if not using User

    def __str__(self):
        return self.name

# Placement Model
class Placement(models.Model):
    company_name = models.CharField(max_length=255)
    logo = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=255)
    roles = models.TextField() # Comma separated
    eligibility = models.CharField(max_length=255)
    package = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name

# Event Model
class Event(models.Model):
    event_name = models.CharField(max_length=255)
    image = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=255)
    rules = models.TextField(blank=True, null=True)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.event_name

# Competition Model
class Competition(models.Model):
    event = models.ForeignKey(Event, related_name='competitions', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    image = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField()
    prize = models.CharField(max_length=255)
    team_size = models.CharField(max_length=50, blank=True, null=True)
    type = models.CharField(max_length=50, blank=True, null=True) # Individual, Team

    def __str__(self):
        return f"{self.event.event_name} - {self.name}"

# Registrations
class PlacementRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    placement = models.ForeignKey(Placement, on_delete=models.CASCADE)
    role_name = models.CharField(max_length=255)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    resume_name = models.CharField(max_length=255, blank=True, null=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Applied')

    class Meta:
        unique_together = ('student', 'placement', 'role_name')

class EventRegistration(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'competition')
