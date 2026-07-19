from decimal import Decimal
import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from management.models import (
    Client, Case, Hearing, Invoice, Deadline
)

class Command(BaseCommand):
    help = 'Seeds the database with dummy data for Law Firm'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding dummy data...')

        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write(self.style.ERROR('Admin user not found! Please run the createsuperuser script first.'))
            return

        # 1. Create Clients
        clients = []
        for i in range(1, 6):
            client = Client(
                name=f"Dummy Client {i}",
                cnic=f"12345-6789012-{i}",
                mobile_number=f"+92 300 123456{i}",
                address=f"{i}23 Main Street, City",
            )
            client.save()
            clients.append(client)
            self.stdout.write(f"Created Client: {client.name}")

        # 2. Create Cases
        cases = []
        case_types = ['Civil', 'Criminal', 'Corporate', 'Family']
        courts = ['High Court', 'Supreme Court', 'District Court']
        
        for i in range(1, 8):
            client = random.choice(clients)
            case = Case(
                title=f"{client.name} vs State",
                client=client,
                advocate=admin_user,
                case_type=random.choice(case_types),
                status='Active',
                court=random.choice(courts),
                judge_name=f"Honorable Judge {random.randint(1, 5)}",
                description="This is a generated dummy case for testing purposes.",
                filing_date=timezone.now().date() - timedelta(days=random.randint(10, 100))
            )
            case.save()
            cases.append(case)
            self.stdout.write(f"Created Case: {case.title}")

        # 3. Create Hearings
        for i in range(1, 10):
            case = random.choice(cases)
            hearing_date = timezone.now() + timedelta(days=random.randint(1, 30))
            Hearing.objects.create(
                case=case,
                date=hearing_date,
                purpose="Evidence recording and arguments",
                outcome="Pending",
                notes="Generated hearing record."
            )
            self.stdout.write(f"Created Hearing for Case: {case.title}")

        # 4. Create Deadlines
        for i in range(1, 6):
            case = random.choice(cases)
            Deadline.objects.create(
                case=case,
                title=f"Submit Document Set {i}",
                due_date=timezone.now().date() + timedelta(days=random.randint(2, 14)),
                status='Pending',
                description="Important submission deadline."
            )
            self.stdout.write(f"Created Deadline for Case: {case.title}")

        # 5. Create Invoices
        for i in range(1, 5):
            client = random.choice(clients)
            Invoice.objects.create(
                client=client,
                amount=Decimal(random.randint(5000, 50000)),
                due_date=timezone.now().date() + timedelta(days=15),
                status='Unpaid',
                description=f"Legal consultation and initial filing fees."
            )
            self.stdout.write(f"Created Invoice for Client: {client.name}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database!'))
