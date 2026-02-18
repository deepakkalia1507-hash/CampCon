import os
import django
from django.core.management import call_command

if __name__ == "__main__":
    print("Redirecting to management command...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
    django.setup()
    call_command('seed_db')
