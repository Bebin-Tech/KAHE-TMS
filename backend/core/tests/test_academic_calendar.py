from datetime import timedelta
from io import BytesIO
from time import perf_counter
from uuid import uuid4

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from openpyxl import Workbook
from rest_framework.test import APIClient

from core.models import AcademicCalendarEvent, AcademicCalendarImport, Department, Notification, User


class AcademicCalendarWorkspaceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.dean = User.objects.create_user(username='calendar-test-dean', password='calendar-test-only', role='DEAN')
        other_dean = User.objects.create_user(username='other-calendar-dean', role='DEAN')
        cls.department = Department.objects.create(name='Calendar test department')
        cls.hod = User.objects.create_user(username='calendar-test-hod', role='HOD', department=cls.department)
        start = timezone.now() + timedelta(days=2)
        AcademicCalendarEvent.objects.bulk_create([
            AcademicCalendarEvent(
                title=f'Calendar activity {index:04d}',
                created_by=cls.dean,
                academic_year='2026-2027',
                start_date=start + timedelta(days=index // 8),
                assigned_to=cls.hod if index % 3 == 0 else None,
            ) for index in range(2000)
        ] + [
            AcademicCalendarEvent(title='Private event', created_by=other_dean, academic_year='2027-2028', start_date=start),
            AcademicCalendarEvent(title='Legacy imported row', created_by=cls.dean, academic_year='2026-2027',
                                  start_date=start, source='EXCEL_IMPORT'),
        ])
        layout = {
            'sheet_name': 'Stress test calendar',
            'columns': [{'letter': chr(65 + col), 'width': 12} for col in range(16)],
            'merged_ranges': ['D79:D84'],
            'rows': [
                {
                    'index': index,
                    'date_key': '2026-12-01',
                    'particulars': f'Calendar row {index}',
                    'cells': [{'ref': f'{chr(65 + col)}{index}', 'value': str(index) if col == 0 else f'Cell {col}'}
                              for col in range(16)],
                } for index in range(1, 2401)
            ],
        }
        for owner in (other_dean, cls.dean, cls.dean):
            record = AcademicCalendarImport.objects.create(
                batch_id=uuid4(), file_name='calendar.xlsx', academic_year='2026-2027',
                created_by=owner, layout=layout, activity_count=2400,
            )
            if owner == other_dean:
                cls.private_import = record
            else:
                cls.latest_import = record

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.dean)

    def test_dean_workspace_is_bounded_and_isolates_other_deans(self):
        start = perf_counter()
        with self.assertNumQueries(8):
            response = self.client.get('/api/academic-calendar/workspace/')
        elapsed = perf_counter() - start
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 2000)
        self.assertEqual(data['stats']['total'], 2001)
        self.assertEqual(data['stats']['imported'], 4800)
        self.assertEqual(data['latest_import']['id'], self.latest_import.id)
        self.assertNotIn('layout', data['latest_import'])
        self.assertEqual(len(data['events']), 12)
        self.assertEqual(data['years'], ['2026-2027'])
        self.assertGreater(len(data['assigned_starts']), 12)
        self.assertLess(len(response.content), 30_000)
        self.assertEqual(self.client.get('/api/academic-calendar/workspace/',
                                        HTTP_IF_NONE_MATCH=response['ETag']).status_code, 304)
        second = self.client.get('/api/academic-calendar/workspace/', {'page': 2}).json()
        self.assertEqual(second['events'][0]['title'], 'Calendar activity 0012')
        layout = self.client.get(f'/api/academic-calendar/import-layout/{self.latest_import.id}/')
        self.assertEqual(len(layout.json()['rows']), 2400)
        compressed = self.client.get(f'/api/academic-calendar/import-layout/{self.latest_import.id}/',
                                     HTTP_ACCEPT_ENCODING='gzip')
        self.assertEqual(compressed['Content-Encoding'], 'gzip')
        self.assertLess(len(compressed.content), len(layout.content) // 4)
        self.assertEqual(self.client.get(f'/api/academic-calendar/import-layout/{self.private_import.id}/').status_code, 404)
        legacy_bytes = (
            len(self.client.get('/api/academic-calendar/').content)
            + len(self.client.get('/api/academic-calendar/imports/').content)
        )
        print(f'Dean workspace: {len(response.content):,} bytes in {elapsed * 1000:.0f} ms; '
              f'compressed workbook: {len(compressed.content):,} bytes; '
              f'previous combined load: {legacy_bytes:,} bytes')

    def test_calendar_changes_update_the_workspace_and_release_only_once(self):
        baseline = self.client.get('/api/academic-calendar/workspace/')
        payload = {
            'title': 'Calendar CRUD test', 'academic_year': '2026-2027',
            'start_date': timezone.now().isoformat(), 'assigned_to': self.hod.id,
            'department': self.department.id,
        }
        response = self.client.post('/api/academic-calendar/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        event_id = response.json()['id']
        self.assertEqual(self.client.patch(f'/api/academic-calendar/{event_id}/', {'title': 'Edited'}, format='json').status_code, 200)
        changed = self.client.get('/api/academic-calendar/workspace/', HTTP_IF_NONE_MATCH=baseline['ETag'])
        self.assertEqual(changed.json()['stats']['total'], 2002)
        self.assertEqual(changed.json()['events'][0]['title'], 'Edited')
        self.assertEqual(Notification.objects.filter(user=self.hod).count(), 1)
        self.assertEqual(self.client.delete(f'/api/academic-calendar/{event_id}/').status_code, 204)
        self.assertEqual(self.client.get('/api/academic-calendar/workspace/').json()['count'], 2000)

    def test_workbook_upload_does_not_return_the_sheet_twice(self):
        workbook = Workbook()
        workbook.active.append(['December'])
        workbook.active.append([1, 'Tuesday', 'Academic program'])
        body = BytesIO()
        workbook.save(body)
        upload = SimpleUploadedFile('date-wise.xlsx', body.getvalue())
        response = self.client.post('/api/academic-calendar/import-excel/?metadata_only=1',
                                    {'file': upload, 'academic_year': '2026-2027'})
        self.assertEqual(response.status_code, 201)
        self.assertNotIn('imported_calendar', response.json())
        self.assertEqual(AcademicCalendarImport.objects.get(batch_id=response.json()['import_batch_id']).activity_count, 1)
        self.assertEqual(self.client.get('/api/academic-calendar/workspace/').json()['stats']['imported'], 4801)
