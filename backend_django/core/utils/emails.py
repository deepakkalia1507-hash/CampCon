from django.core.mail import send_mail
from django.conf import settings

def send_welcome_email(student_email, student_name):
    """Sends a welcome email upon student registration."""
    subject = 'Welcome to Campus Connect!'
    message = f"""Hi {student_name},

Welcome to Campus Connect! Your account has been successfully created.
You can now log in to view upcoming placement drives and campus events.

Best regards,
Campus Connect Team
"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@campusconnect.com',
            [student_email],
            fail_silently=False,
        )
    except Exception as e:
        # In production, use a logger instead of print
        pass

def send_event_registration_email(student_email, event_title, event_date):
    """Sends confirmation for event registration."""
    subject = f'Registration Confirmed: {event_title}'
    message = f"""You have successfully registered for the event: {event_title}.

Date: {event_date}

We look forward to seeing you there!

Best regards,
Campus Connect Team
"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@campusconnect.com',
            [student_email],
            fail_silently=False,
        )
    except Exception as e:
        pass

def send_placement_registration_email(student_email, company_name, date):
    """Sends confirmation for placement drive registration."""
    subject = f'Placement Drive Registration: {company_name}'
    message = f"""You have successfully applied for the {company_name} placement drive.

Date: {date}

Prepare well and good luck!

Best regards,
Campus Connect Team
"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@campusconnect.com',
            [student_email],
            fail_silently=False,
        )
    except Exception as e:
        pass
