"""
Management command: flush_dummy_data
-------------------------------------
Deletes ALL business data from the database while preserving superuser accounts.

Tables cleared (in FK-safe order):
  1. HistoricalRecords for all tracked models
  2. HearingDocument
  3. Hearing
  4. Payment
  5. Invoice
  6. Case
  7. Task
  8. ConsultationRequest
  9. Client (and its linked portal User accounts)
  10. Non-superuser User accounts (staff)
  11. UserProfile rows for any remaining non-superuser users

Usage:
    python manage.py flush_dummy_data              # dry-run (shows counts)
    python manage.py flush_dummy_data --confirm    # actually deletes
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction


class Command(BaseCommand):
    help = "Wipe all dummy/test business data, preserving only superuser accounts."

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Actually perform the deletion. Without this flag the command runs as a dry-run.',
        )

    def handle(self, *args, **options):
        from management.models import (
            Client, Case, Hearing, HearingDocument,
            Payment, Invoice, Task, ConsultationRequest, UserProfile,
        )

        # ── Gather counts for preview ──────────────────────────────────────────
        counts = {
            'HearingDocument':      HearingDocument.objects.count(),
            'Hearing':              Hearing.objects.count(),
            'Payment':              Payment.objects.count(),
            'Invoice':              Invoice.objects.count(),
            'Case':                 Case.objects.count(),
            'Task':                 Task.objects.count(),
            'ConsultationRequest':  ConsultationRequest.objects.count(),
            'Client':               Client.objects.count(),
        }

        # Count non-superuser Users (staff + client portal accounts)
        non_super_users = User.objects.filter(is_superuser=False)
        counts['Non-superuser Users'] = non_super_users.count()

        # Count history tables
        try:
            from management.models import (
                HistoricalClient, HistoricalCase,
                HistoricalHearing, HistoricalInvoice,
            )
            counts['HistoricalClient']  = HistoricalClient.objects.count()
            counts['HistoricalCase']    = HistoricalCase.objects.count()
            counts['HistoricalHearing'] = HistoricalHearing.objects.count()
            counts['HistoricalInvoice'] = HistoricalInvoice.objects.count()
            has_history = True
        except ImportError:
            has_history = False

        # ── Print preview ──────────────────────────────────────────────────────
        self.stdout.write(self.style.WARNING('\n=== flush_dummy_data: PREVIEW ==='))
        for model, count in counts.items():
            self.stdout.write(f'  {model:<30} {count} rows')

        superusers = User.objects.filter(is_superuser=True)
        self.stdout.write(self.style.SUCCESS(
            f'\n  Superusers PRESERVED ({superusers.count()}): '
            + ', '.join(u.username for u in superusers)
        ))

        if not options['confirm']:
            self.stdout.write(self.style.NOTICE(
                '\nDry-run complete. Re-run with --confirm to actually delete.'
            ))
            return

        # ── Confirm prompt ─────────────────────────────────────────────────────
        self.stdout.write(self.style.ERROR(
            '\n⚠️  THIS WILL PERMANENTLY DELETE ALL BUSINESS DATA FROM THE DATABASE.'
        ))
        answer = input('Type "yes" to proceed: ').strip().lower()
        if answer != 'yes':
            self.stdout.write(self.style.NOTICE('Aborted.'))
            return

        # ── Delete in FK-safe order ────────────────────────────────────────────
        with transaction.atomic():

            # 1. History tables first (no FK dependencies from other models)
            if has_history:
                deleted, _ = HistoricalClient.objects.all().delete()
                self.stdout.write(f'  Deleted {deleted} HistoricalClient rows')
                deleted, _ = HistoricalCase.objects.all().delete()
                self.stdout.write(f'  Deleted {deleted} HistoricalCase rows')
                deleted, _ = HistoricalHearing.objects.all().delete()
                self.stdout.write(f'  Deleted {deleted} HistoricalHearing rows')
                deleted, _ = HistoricalInvoice.objects.all().delete()
                self.stdout.write(f'  Deleted {deleted} HistoricalInvoice rows')

            # 2. Leaf models with FKs into Case/Hearing
            deleted, _ = HearingDocument.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} HearingDocument rows')

            deleted, _ = Hearing.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Hearing rows')

            deleted, _ = Payment.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Payment rows')

            deleted, _ = Invoice.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Invoice rows')

            # 3. Case (depends on Client)
            deleted, _ = Case.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Case rows')

            # 4. Standalone models
            deleted, _ = Task.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Task rows')

            deleted, _ = ConsultationRequest.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} ConsultationRequest rows')

            # 5. Client — also cascades to the linked portal User (client_profile)
            deleted, _ = Client.objects.all().delete()
            self.stdout.write(f'  Deleted {deleted} Client rows (+ cascaded portal Users)')

            # 6. Any remaining non-superuser Users (staff accounts) + their profiles
            deleted, _ = non_super_users.delete()
            self.stdout.write(f'  Deleted {deleted} non-superuser User rows')

        self.stdout.write(self.style.SUCCESS(
            '\n✅  Database cleaned. Only superuser accounts remain.\n'
        ))
