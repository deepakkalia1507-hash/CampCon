from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from core.models import Event, Placement, EventRegistration, PlacementRegistration

class Command(BaseCommand):
    help = 'Sends reminder emails for events and placements happening tomorrow'

    def handle(self, *args, **kwargs):
        tomorrow = timezone.now().date() + timedelta(days=1)
        self.stdout.write(f"Checking for events on {tomorrow}...")

        # 1. Events
        events = Event.objects.filter(date=tomorrow)
        for event in events:
            registrations = EventRegistration.objects.filter(competition__event=event)
            # Distinct students in case they registered for multiple competitions in same event
            student_emails = set()
            for reg in registrations:
                if reg.student.email:
                    student_emails.add(reg.student.email)
            
            if student_emails:
                subject = f"Reminder: Upcoming Event - {event.event_name}"
                message = f"""Hi there,

This is a reminder that the event '{event.event_name}' is scheduled for tomorrow, {event.date}.
Location: {event.venue}

Don't miss out!

Best regards,
Campus Connect Team
"""
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@campusconnect.com',
                        list(student_emails),
                        fail_silently=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Sent event reminder to {len(student_emails)} students for '{event.event_name}'"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to send event reminder: {e}"))

        # 2. Placements
        placements = Placement.objects.filter(date=tomorrow)
        for placement in placements:
            registrations = PlacementRegistration.objects.filter(placement=placement)
            student_emails = set()
            for reg in registrations:
                if reg.student.email:
                    student_emails.add(reg.student.email)

            if student_emails:
                subject = f"Reminder: Placement Drive - {placement.company_name}"
                message = f"""Hi there,

This is a reminder for the Placement Drive by {placement.company_name} scheduled for tomorrow, {placement.date}.

Good luck!

Best regards,
Campus Connect Team
"""
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@campusconnect.com',
                        list(student_emails),
                        fail_silently=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f"Sent placement reminder to {len(student_emails)} students for '{placement.company_name}'"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Failed to send placement reminder: {e}"))
