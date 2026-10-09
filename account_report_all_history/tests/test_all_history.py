from odoo import fields
from odoo.tests import tagged

from odoo.addons.account.tests.common import AccountTestInvoicingCommon


@tagged('post_install', '-at_install')
class TestAllHistory(AccountTestInvoicingCommon):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.old_invoice = cls.init_invoice('out_invoice', invoice_date='2001-01-15', amounts=[100], post=True)
        cls.general_ledger = cls.env.ref('account_reports.general_ledger_report')
        cls.balance_sheet = cls.env.ref('account_reports.balance_sheet')
        cls.profit_and_loss = cls.env.ref('account_reports.profit_and_loss')

    def _options(self, report, date):
        return report.with_company(self.company_data['company']).get_options({'date': date})

    def test_range_report_spans_whole_history(self):
        options = self._options(self.general_ledger, {'filter': 'all_history', 'mode': 'range'})
        self.assertEqual(options['date']['filter'], 'all_history')
        self.assertEqual(options['date']['date_from'], '2001-01-15')
        self.assertGreaterEqual(options['date']['date_to'], fields.Date.to_string(fields.Date.context_today(self.general_ledger)))
        self.assertEqual(options['date']['string'], "All history")

    def test_bounds_are_recomputed_on_reload(self):
        """Stale dates coming from the previous options are ignored."""
        options = self._options(self.general_ledger, {
            'filter': 'all_history', 'mode': 'range',
            'date_from': '2020-01-01', 'date_to': '2020-12-31',
        })
        self.assertEqual(options['date']['date_from'], '2001-01-15')

    def test_single_date_report_falls_back_to_today(self):
        options = self._options(self.balance_sheet, {'filter': 'all_history', 'mode': 'range'})
        self.assertEqual(options['date']['filter'], 'today')

    def test_report_lines_include_old_entries(self):
        options = self._options(self.general_ledger, {'filter': 'all_history', 'mode': 'range'})
        lines = self.general_ledger.with_company(self.company_data['company'])._get_lines(options)
        self.assertTrue(lines)

    def test_other_filters_untouched(self):
        options = self._options(self.general_ledger, {'filter': 'this_year', 'mode': 'range'})
        self.assertNotEqual(options['date']['filter'], 'all_history')

    def test_comparison_with_previous_period(self):
        report = self.profit_and_loss.with_company(self.company_data['company'])
        options = report.get_options({'date': {'filter': 'all_history', 'mode': 'range'}, 'comparison': {'filter': 'previous_period', 'number_period': 1}})
        self.assertEqual(len(options['comparison']['periods']), 1)
        # the generic report may open on its localized variant
        self.assertTrue(report.browse(options['report_id'])._get_lines(options))
