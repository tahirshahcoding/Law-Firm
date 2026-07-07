"""
seed_data.py - Populate the database with realistic Swat-locals dummy data.

Usage (from project root, with venv active):
    python backend/manage.py seed_data
    python backend/manage.py seed_data --flush   # Clear existing data first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from datetime import date, timedelta
import random

from management.models import (
    UserProfile, Client, Case, Hearing,
    Payment, Task, Invoice, ConsultationRequest
)


# ── DATA POOLS  (realistic Swat / KPK names and locations) ───────────────────

SWAT_CLIENTS = [
    {"name": "Muhammad Azam Khan",      "cnic": "15401-1234567-1", "mobile": "0946-111234", "address": "Mingora, Swat"},
    {"name": "Fazal Rehman Yousafzai",  "cnic": "15401-2345678-3", "mobile": "0946-222345", "address": "Saidu Sharif, Swat"},
    {"name": "Gul Badshah",             "cnic": "15401-3456789-5", "mobile": "0946-333456", "address": "Matta, Swat"},
    {"name": "Shahid Ullah Khan",       "cnic": "15401-4567890-7", "mobile": "0946-444567", "address": "Khwazakhela, Swat"},
    {"name": "Noor Muhammad Swati",     "cnic": "15401-5678901-9", "mobile": "0946-555678", "address": "Bahrain, Swat"},
    {"name": "Imran Ali Shah",          "cnic": "15402-6789012-1", "mobile": "0946-666789", "address": "Madyan, Swat"},
    {"name": "Tariq Hussain Wazir",     "cnic": "15402-7890123-3", "mobile": "0946-777890", "address": "Charbagh, Swat"},
    {"name": "Abdul Malik Akhundzada",  "cnic": "15402-8901234-5", "mobile": "0946-888901", "address": "Kabal, Swat"},
    {"name": "Khalid Pervez Afridi",    "cnic": "15403-9012345-7", "mobile": "0946-999012", "address": "Barikot, Swat"},
    {"name": "Zarghoon Khan",           "cnic": "15403-0123456-9", "mobile": "0946-000123", "address": "Landakai, Swat"},
    {"name": "Naseer Ahmad Yusuf",      "cnic": "15404-1234560-1", "mobile": "0946-112233", "address": "Miandam, Swat"},
    {"name": "Riaz Ul Haq",             "cnic": "15404-2345671-3", "mobile": "0946-223344", "address": "Fatehpur, Swat"},
    {"name": "Sher Ali Khan",           "cnic": "15404-3456782-5", "mobile": "0946-334455", "address": "Asharaat, Swat"},
    {"name": "Bakht Munir",             "cnic": "15405-4567893-7", "mobile": "0946-445566", "address": "Fizagat, Swat"},
    {"name": "Wazir Zada Khattak",      "cnic": "15405-5678904-9", "mobile": "0946-556677", "address": "Green Chowk, Mingora"},
]

COURTS = [
    "Civil Court Swat",
    "District and Sessions Court Swat",
    "Additional Sessions Court Swat",
    "Family Court Mingora",
    "Consumer Protection Court Swat",
    "Senior Civil Judge Court Swat",
    "Banking Court Peshawar",
    "High Court Peshawar Bench",
]

JUDGES = [
    "Mian Asif Rehman",
    "Zafar Iqbal Khan",
    "Shakeel Ahmad Mir",
    "Syed Nadeem Hussain",
    "Khalid Mahmood",
    "Abdul Rauf",
    "Anwar Ul Haq",
    "Rehmat Ullah Shah",
]

DISTRICTS = ["Swat", "Buner", "Dir Lower", "Dir Upper", "Shangla", "Peshawar"]
TEHSILS   = ["Mingora", "Kabal", "Barikot", "Matta", "Charbagh", "Khwazakhela", "Bahrain"]

OPPONENT_NAMES = [
    "Haji Alam Zeb",        "Sher Bahadur Khan",
    "Asif Ali Qureshi",     "Mehmood Ullah Jan",
    "Umar Daraz",           "Liaqat Shah",
    "Saeed Ahmad Bacha",    "Zubair Ahmed",
    "Fazli Karim",          "Tahir Nawaz",
    "Qasim Khan Wazir",     "Anwar Hussain Swati",
    "Sahib Zada Khan",      "Raza Muhammad",
    "Haji Ghulam Nabi",
]

HEARING_STAGES = [
    "Attendance", "Arguments", "Evidence", "Witness",
    "Framing of Issues", "Final Arguments", "Judgment", "Cross-Examination",
]

TASK_TITLES = [
    "Draft affidavit for Muhammad Azam Khan",
    "File vakalatnama at Sessions Court",
    "Collect CNIC copy from client Gul Badshah",
    "Prepare power of attorney for Fazal Rehman",
    "Attend next hearing for Case 2024/123",
    "Send reminder to client about fee payment",
    "Research precedent cases on land disputes",
    "Submit bail application for Sher Ali Khan",
    "Renew court fee stamp papers",
    "Follow up with police station for FIR copy",
    "Prepare legal notice for property dispute",
    "Verify family tree documents from NADRA",
    "Arrange witness for deposition session",
    "File revision petition at High Court",
    "Update client on case status",
    "Translate Urdu documents to Pashto for client",
    "Prepare interim injunction application",
    "Collect decree copy from court office",
    "Consult with senior advocate on strategy",
    "Archive closed case files",
]

CONSULTATION_NAMES = [
    "Nadia Bibi",       "Rukhsana Gul",
    "Muhammad Ishaq",   "Fawad Ahmed",
    "Hamid Ullah",      "Samina Kosar",
    "Abdul Qadir",      "Hina Shah",
    "Gulshan Ara",      "Faiz Muhammad",
]

INQUIRY_TYPES = [
    "Property Dispute", "Family Law", "Criminal Defense",
    "Civil Litigation", "Labour Dispute", "Banking / Loan",
    "Inheritance", "Divorce / Khula", "Writ Petition", "Consumer Rights",
]

CONSULTATION_MESSAGES = [
    "I have a land dispute with my neighbour in Mingora. Need urgent legal help.",
    "My husband has filed for divorce. I want to know my rights regarding children.",
    "Police registered a false FIR against me. Looking for bail and defence.",
    "Our family property was occupied illegally. Need to file a case.",
    "I was dismissed from my job without notice. Want to know my options.",
    "Bank is pressuring me for a loan I already paid. Need legal support.",
    "My father passed away and siblings are not giving me my inheritance share.",
    "My husband left and has not provided maintenance for 6 months.",
    "I want to challenge a government order that affected my business.",
    "The shop I rented was sold without informing me. What are my rights?",
]


class Command(BaseCommand):
    help = "Seed the database with Swat-locals dummy data for all sections."

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing data before seeding.',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write(self.style.WARNING("[!] Flushing existing data..."))
            ConsultationRequest.objects.all().delete()
            Invoice.objects.all().delete()
            Payment.objects.all().delete()
            Hearing.objects.all().delete()
            Case.objects.all().delete()
            Client.objects.all().delete()
            Task.objects.all().delete()
            UserProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("[OK] Data cleared.\n"))

        # 1. Ensure admin user
        self._ensure_admin()

        # 2. Create Staff users
        staff_users = self._create_staff()

        # 3. Clients
        clients = self._create_clients()

        # 4. Cases
        cases = self._create_cases(clients, staff_users)

        # 5. Hearings
        self._create_hearings(cases)

        # 6. Payments
        self._create_payments(cases)

        # 7. Invoices
        self._create_invoices(cases)

        # 8. Tasks
        self._create_tasks()

        # 9. Consultation Requests
        self._create_consultations()

        self.stdout.write(self.style.SUCCESS(
            "\n[DONE] Seeding complete! All dummy data has been created.\n"
            "       Admin login --> username: admin | password: admin123\n"
        ))

    # ── HELPERS ───────────────────────────────────────────────────────────────

    def _ensure_admin(self):
        """Make sure an admin / superuser exists with known credentials."""
        user, created = User.objects.get_or_create(username='admin')
        user.set_password('admin123')
        user.is_staff = True
        user.is_superuser = True
        user.first_name = 'Rahimullah'
        user.last_name  = 'Khan'
        user.email = 'admin@rahimullah-advocate.com'
        user.save()

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = 'Admin'
        profile.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"[OK] {action} admin user."))

    def _create_staff(self):
        staff_data = [
            {"username": "sara_legal",  "first": "Sara",  "last": "Afridi",  "role": "Staff"},
            {"username": "bilal_clerk", "first": "Bilal", "last": "Khattak", "role": "Staff"},
            {"username": "usman_para",  "first": "Usman", "last": "Paracha", "role": "Paralegal"},
        ]
        users = []
        for sd in staff_data:
            u, created = User.objects.get_or_create(username=sd["username"])
            u.set_password("staff@123")
            u.first_name = sd["first"]
            u.last_name  = sd["last"]
            u.email = "{}@rahimullah-advocate.com".format(sd["username"])
            u.is_staff = True
            u.save()
            profile, _ = UserProfile.objects.get_or_create(user=u)
            profile.role = sd["role"]
            profile.save()
            users.append(u)
            action = "Created" if created else "Skipped (exists)"
            self.stdout.write("  Staff {}: {}".format(action, sd["username"]))
        self.stdout.write(self.style.SUCCESS("[OK] Staff users ready ({}).".format(len(users))))
        return users

    def _create_clients(self):
        clients = []
        for cd in SWAT_CLIENTS:
            client, created = Client.objects.get_or_create(
                cnic=cd["cnic"],
                defaults={
                    "name":          cd["name"],
                    "mobile_number": cd["mobile"],
                    "address":       cd["address"],
                }
            )
            clients.append(client)
            action = "Created" if created else "Skipped"
            self.stdout.write("  Client {}: {}".format(action, client.name))
        self.stdout.write(self.style.SUCCESS("[OK] Clients ready ({}).".format(len(clients))))
        return clients

    def _create_cases(self, clients, staff_users):
        cases_data = [
            # (client_idx, case_num, court_idx, judge_idx, opp_idx, district, tehsil, total_fee, status)
            (0,  "2024/CIV/001", 0, 0, 0,  "Swat",     "Mingora",      85000,  "Active"),
            (1,  "2024/CRM/002", 1, 1, 1,  "Swat",     "Saidu Sharif", 120000, "Active"),
            (2,  "2024/FAM/003", 3, 2, 2,  "Swat",     "Matta",        55000,  "Active"),
            (3,  "2024/CIV/004", 2, 3, 3,  "Swat",     "Kabal",        200000, "Decided"),
            (4,  "2024/CRM/005", 4, 4, 4,  "Swat",     "Bahrain",      75000,  "Active"),
            (5,  "2024/CIV/006", 0, 5, 5,  "Swat",     "Mingora",      150000, "Active"),
            (6,  "2023/FAM/007", 3, 6, 6,  "Swat",     "Charbagh",     45000,  "Decided"),
            (7,  "2024/CRM/008", 1, 7, 7,  "Swat",     "Kabal",        90000,  "Active"),
            (8,  "2024/WRT/009", 7, 0, 8,  "Peshawar", "Mingora",      180000, "Adjourned"),
            (9,  "2024/CIV/010", 5, 1, 9,  "Swat",     "Barikot",      65000,  "Active"),
            (10, "2024/CRM/011", 1, 2, 10, "Swat",     "Miandam",      110000, "Active"),
            (11, "2023/CIV/012", 0, 3, 11, "Buner",    "Mingora",      95000,  "Withdrawn"),
            (12, "2024/FAM/013", 3, 4, 12, "Swat",     "Fizagat",      40000,  "Active"),
            (13, "2024/CRM/014", 1, 5, 13, "Swat",     "Mingora",      130000, "Active"),
            (14, "2024/CIV/015", 2, 6, 14, "Shangla",  "Bahrain",      70000,  "Active"),
        ]
        cases = []
        all_users = staff_users + [User.objects.get(username='admin')]
        for cd in cases_data:
            ci, cnum, court_i, judge_i, opp_i, dist, tehsil, fee, status = cd
            client = clients[ci]
            case, created = Case.objects.get_or_create(
                case_number=cnum,
                defaults={
                    "client":        client,
                    "assigned_to":   random.choice(all_users),
                    "court":         COURTS[court_i],
                    "judge":         JUDGES[judge_i],
                    "district":      dist,
                    "tehsil":        tehsil,
                    "opponent_name": OPPONENT_NAMES[opp_i],
                    "total_fee":     fee,
                    "status":        status,
                }
            )
            cases.append(case)
            action = "Created" if created else "Skipped"
            self.stdout.write("  Case {}: {} -- {}".format(action, cnum, client.name))
        self.stdout.write(self.style.SUCCESS("[OK] Cases ready ({}).".format(len(cases))))
        return cases

    def _create_hearings(self, cases):
        count = 0
        today = date.today()
        for case in cases:
            if Hearing.objects.filter(case=case).exists():
                continue
            num_hearings = random.randint(2, 5)
            hearing_date = today - timedelta(days=random.randint(60, 180))
            for i in range(num_hearings):
                next_d = hearing_date + timedelta(days=random.randint(20, 45))
                Hearing.objects.create(
                    case=case,
                    hearing_date=hearing_date,
                    next_date=next_d if i < num_hearings - 1 else None,
                    hearing_stage=random.choice(HEARING_STAGES),
                    notes="Hearing proceeding for {}. Client present. Next date set.".format(case.case_number),
                )
                hearing_date = next_d
                count += 1
        self.stdout.write(self.style.SUCCESS("[OK] Hearings created ({}).".format(count)))

    def _create_payments(self, cases):
        count = 0
        for case in cases:
            if Payment.objects.filter(case=case).exists():
                continue
            total = float(case.total_fee)
            paid_pct = random.uniform(0.3, 0.9)
            paid_total = total * paid_pct
            num_payments = random.randint(1, 3)
            per_payment = paid_total / num_payments
            for _ in range(num_payments):
                Payment.objects.create(
                    case=case,
                    amount_received=f"{per_payment:.2f}",
                )
                count += 1
        self.stdout.write(self.style.SUCCESS("[OK] Payments created ({}).".format(count)))

    def _create_invoices(self, cases):
        count = 0
        today = date.today()
        statuses = ["Paid", "Paid", "Partial", "Pending"]
        for case in cases:
            if Invoice.objects.filter(case=case).exists():
                continue
            Invoice.objects.create(
                case=case,
                amount=case.total_fee,
                description="Professional legal services rendered for {}".format(case.case_number),
                issue_date=today - timedelta(days=random.randint(30, 120)),
                due_date=today + timedelta(days=random.randint(5, 30)),
                status=random.choice(statuses),
            )
            count += 1
        self.stdout.write(self.style.SUCCESS("[OK] Invoices created ({}).".format(count)))

    def _create_tasks(self):
        count = 0
        today = date.today()
        for i, title in enumerate(TASK_TITLES):
            if Task.objects.filter(title=title).exists():
                continue
            is_done = (i % 4 == 0)
            due = today + timedelta(days=random.randint(-5, 30))
            Task.objects.create(
                title=title,
                is_completed=is_done,
                due_date=due,
            )
            count += 1
        self.stdout.write(self.style.SUCCESS("[OK] Tasks created ({}).".format(count)))

    def _create_consultations(self):
        count = 0
        statuses = ["New", "New", "Contacted", "Converted", "Closed"]
        for i, name in enumerate(CONSULTATION_NAMES):
            phone = "03{}-{}".format(random.randint(10, 49), random.randint(1000000, 9999999))
            msg = CONSULTATION_MESSAGES[i % len(CONSULTATION_MESSAGES)]
            inquiry = INQUIRY_TYPES[i % len(INQUIRY_TYPES)]
            if ConsultationRequest.objects.filter(name=name, inquiry_type=inquiry).exists():
                continue
            ConsultationRequest.objects.create(
                name=name,
                email="{}@gmail.com".format(name.lower().replace(' ', '.')),
                phone=phone,
                inquiry_type=inquiry,
                message=msg,
                status=random.choice(statuses),
            )
            count += 1
        self.stdout.write(self.style.SUCCESS("[OK] Consultation requests created ({}).".format(count)))
