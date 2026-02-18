from django.core.management.base import BaseCommand
from core.models import Placement, Event, Competition, Student
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Seeds the database with initial data for Placements and Events'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # Clear existing data to avoid duplicates
        self.stdout.write("Clearing old data...")
        Placement.objects.all().delete()
        Event.objects.all().delete()
        Competition.objects.all().delete()

        # Students
        Student.objects.filter(register_number='12345').delete()
        Student.objects.filter(email='student@test.com').delete()
        Student.objects.create(
            register_number='12345',
            name='Test Student',
            email='student@test.com',
            phone='9876543210',
            student_class='B.Tech',
            department='CS',
            year='4',
            college='Engineering College',
            password_hash='password123'
        )
        self.stdout.write("Created test student: 12345")

        # Placements
        placements_data = [
          {
            "company_name": 'TechCorp Solutions',
            "logo": 'https://images.unsplash.com/photo-1549421263-5ec394a5ad4c?auto=format&fit=crop&w=400&q=80',
            "description": 'Leading technology company specializing in cloud computing and AI solutions.',
            "date": '2026-03-15',
            "time": '10:00:00',
            "venue": 'Main Auditorium',
            "roles": 'Software Engineer,Data Analyst,Cloud Architect,AI/ML Engineer,DevOps Engineer,Frontend Developer,Backend Developer,Full Stack Developer',
            "eligibility": 'B.E./B.Tech in CS/IT with 7.0+ CGPA',
            "package": '₹8-15 LPA'
          },
          {
            "company_name": 'InnovateTech',
            "logo": 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
            "description": 'Innovative startup focused on mobile applications and web development.',
            "date": '2026-03-20',
            "time": '14:00:00',
            "venue": 'Conference Hall A',
            "roles": 'Mobile App Developer,UI/UX Designer,React Developer,Node.js Developer,Product Manager,QA Engineer',
            "eligibility": 'Any engineering branch with coding skills',
            "package": '₹6-12 LPA'
          },
          {
            "company_name": 'DataMinds Analytics',
            "logo": 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
            "description": 'Data analytics and business intelligence company.',
            "date": '2026-03-25',
            "time": '11:00:00',
            "venue": 'Seminar Hall B',
            "roles": 'Data Scientist,Business Analyst,Data Engineer,BI Developer,Statistical Analyst,Machine Learning Engineer',
            "eligibility": 'B.Sc/B.Tech in CS/Statistics/Mathematics',
            "package": '₹7-14 LPA'
          },
          {
            "company_name": 'CyberSecure Inc',
            "logo": 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
            "description": 'Cybersecurity solutions and consulting firm.',
            "date": '2026-04-01',
            "time": '09:00:00',
            "venue": 'Lab Complex',
            "roles": 'Security Analyst,Penetration Tester,Security Engineer,SOC Analyst,Cryptographer,Network Security Specialist',
            "eligibility": 'B.Tech in CS/IT with security certifications preferred',
            "package": '₹9-18 LPA'
          },
          {
            "company_name": 'CloudNine Technologies',
            "logo": 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
            "description": 'Cloud infrastructure and DevOps services provider.',
            "date": '2026-04-05',
            "time": '13:00:00',
            "venue": 'Main Auditorium',
            "roles": 'Cloud Engineer,DevOps Engineer,Site Reliability Engineer,AWS Specialist,Azure Developer,Kubernetes Administrator',
            "eligibility": 'B.E./B.Tech with cloud certifications',
            "package": '₹10-20 LPA'
          }
        ]

        for p_data in placements_data:
            # Avoid duplicates by deleting existing
            Placement.objects.filter(company_name=p_data['company_name']).delete()
            Placement.objects.create(**p_data)
            self.stdout.write(f"Created placement: {p_data['company_name']}")

        # Events
        events_data = [
          {
            "event_name": 'Cultural Fest 2026',
            "image": 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
            "description": 'Annual cultural celebration featuring various artistic competitions.',
            "date": '2026-03-18',
            "time": '18:00:00',
            "venue": 'College Ground',
            "competitions": [
              { "name": 'Singing Competition', "image": 'https://images.unsplash.com/photo-1769525649442-fd8b058b85ab?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Solo and group singing performances', "prize": '₹10,000', "team_size": '1-5', "type": 'Individual/Team' },
              { "name": 'Dance Competition', "image": 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80', "description": 'Classical, contemporary, and folk dance', "prize": '₹15,000', "team_size": '1-10', "type": 'Individual/Team' },
              { "name": 'Box Cricket', "image": 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80', "description": '5-a-side cricket tournament', "prize": '₹20,000', "team_size": '5', "type": 'Team' },
              { "name": 'Drama/Theatre', "image": 'https://plus.unsplash.com/premium_photo-1683219368393-96002fb69cd6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Short play competition', "prize": '₹12,000', "team_size": '3-15', "type": 'Team' },
              { "name": 'Fashion Show', "image": 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', "description": 'Traditional and modern fashion', "prize": '₹8,000', "team_size": '1-10', "type": 'Individual/Team' }
            ],
            "rules": 'General rules apply. Specific rules for each competition will be provided at registration.',
            "contact_person": 'Cultural Committee Head',
            "contact_number": '9876543210'
          },
          {
            "event_name": 'Tech Symposium 2026',
            "image": 'https://plus.unsplash.com/premium_photo-1664303775494-e13398a68539?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            "description": 'Technical event showcasing innovation and creativity.',
            "date": '2026-03-22',
            "time": '09:00:00',
            "venue": 'Computer Lab',
            "competitions": [
              { "name": 'Hackathon', "image": 'https://images.unsplash.com/photo-1637073849667-91120a924221?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": '24-hour coding challenge', "prize": '₹50,000', "team_size": '2-4', "type": 'Team' },
              { "name": 'Coding Contest', "image": 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80', "description": 'Algorithmic problem solving', "prize": '₹25,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Robotics Challenge', "image": 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', "description": 'Build and compete with robots', "prize": '₹30,000', "team_size": '2-3', "type": 'Team' },
              { "name": 'Web Design', "image": 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80', "description": 'Creative website development', "prize": '₹15,000', "team_size": '1-2', "type": 'Individual/Team' },
              { "name": 'AI Challenge', "image": 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80', "description": 'Machine learning project', "prize": '₹35,000', "team_size": '1-3', "type": 'Individual/Team' }
            ],
            "rules": 'Participants must bring their own laptops. Internet access will be provided.',
            "contact_person": 'Technical Committee Head',
            "contact_number": '9876543211'
          },
          {
            "event_name": 'Sports Meet 2026',
            "image": 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
            "description": 'Annual sports competition with various athletic events.',
            "date": '2026-04-10',
            "time": '07:00:00',
            "venue": 'Sports Ground',
            "competitions": [
              { "name": 'Football Tournament', "image": 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80', "description": 'Inter-department football', "prize": '₹25,000', "team_size": '11-15', "type": 'Team' },
              { "name": 'Basketball', "image": 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', "description": '5v5 basketball tournament', "prize": '₹20,000', "team_size": '5-8', "type": 'Team' },
              { "name": 'Athletics', "image": 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80', "description": 'Track and field events', "prize": '₹15,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Badminton', "image": 'https://images.unsplash.com/photo-1595220427358-8cf2ce3d7f89?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Singles and doubles', "prize": '₹10,000', "team_size": '1-2', "type": 'Individual/Team' },
              { "name": 'Volleyball', "image": 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2014&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Team volleyball competition', "prize": '₹18,000', "team_size": '6-10', "type": 'Team' }
            ],
            "rules": 'Standard sports rules apply. Referees decision is final.',
            "contact_person": 'Sports Secretary',
            "contact_number": '9876543212'
          },
          {
            "event_name": 'Art & Literature Fest 2026',
            "image": 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
            "description": 'Celebrating creativity through art and literary competitions.',
            "date": '2026-04-15',
            "time": '10:00:00',
            "venue": 'Art Gallery',
            "competitions": [
              { "name": 'Painting', "image": 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', "description": 'Canvas painting competition', "prize": '₹12,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Poetry Slam', "image": 'https://images.unsplash.com/photo-1647589927187-4c589aba3dca?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Spoken word poetry', "prize": '₹8,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Photography', "image": 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', "description": 'Photo contest', "prize": '₹10,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Essay Writing', "image": 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80', "description": 'Creative essay competition', "prize": '₹6,000', "team_size": '1', "type": 'Individual' },
              { "name": 'Debate', "image": 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80', "description": 'Parliamentary debate', "prize": '₹9,000', "team_size": '2', "type": 'Team' }
            ],
            "rules": 'Original work only. Plagiarism will lead to disqualification.',
            "contact_person": 'Literary Club Head',
            "contact_number": '9876543213'
          },
          {
            "event_name": 'Entrepreneurship Summit 2026',
            "image": 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
            "description": 'Platform for budding entrepreneurs to showcase ideas.',
            "date": '2026-04-20',
            "time": '14:00:00',
            "venue": 'Business School',
            "competitions": [
              { "name": 'Pitch Competition', "image": 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80', "description": 'Startup pitch presentation', "prize": '₹1,00,000', "team_size": '1-4', "type": 'Team' },
              { "name": 'Business Plan', "image": 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80', "description": 'Comprehensive business plan', "prize": '₹50,000', "team_size": '2-5', "type": 'Team' },
              { "name": 'Innovation Challenge', "image": 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80', "description": 'Novel product ideas', "prize": '₹40,000', "team_size": '2-4', "type": 'Team' },
              { "name": 'Marketing Strategy', "image": 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=800&q=80', "description": 'Marketing campaign design', "prize": '₹25,000', "team_size": '2-3', "type": 'Team' },
              { "name": 'Case Study', "image": 'https://images.unsplash.com/photo-1526378787940-576a539ba69d?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', "description": 'Business case analysis', "prize": '₹20,000', "team_size": '2-3', "type": 'Team' }
            ],
            "rules": 'Formal attire mandatory. Presentations must be submitted beforehand.',
            "contact_person": 'E-Cell President',
            "contact_number": '9876543214'
          }
        ]
        
        for e_data in events_data:
            competitions = e_data.pop('competitions', [])
            
            # Avoid duplicates
            Event.objects.filter(event_name=e_data['event_name']).delete()
            event = Event.objects.create(**e_data)
            self.stdout.write(f"Created event: {event.event_name}")
            
            for c_data in competitions:
                if isinstance(c_data, dict):
                    Competition.objects.create(event=event, **c_data)
                    self.stdout.write(f"  Created competition: {c_data.get('name')}")

        self.stdout.write(self.style.SUCCESS("Seeding completed!"))
