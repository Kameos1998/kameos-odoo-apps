from odoo import fields, models

ALL_HISTORY = 'all_history'


class AccountReport(models.Model):
    _inherit = 'account.report'

    def _init_options_filter_date(self, options, previous_options):
        """Declare `all_history` among the date filters of range-mode reports.

        It falls back to `custom`: the server only ever sees a custom period,
        which every standard helper (comparison, annotations, shifting) knows,
        while `fallback_from` keeps the entry selected in the menu.
        `start_day`, `start_month` and `months_per_period` are only there because
        the client computes a period for every listed filter.
        """
        super()._init_options_filter_date(options, previous_options)
        filter_date = options['filter_date']
        if filter_date['range_mode']:
            filter_date['filters'][ALL_HISTORY] = {
                'key': ALL_HISTORY,
                'label': self.env._("All history"),
                'months_per_period': 12,
                'start_day': 1,
                'start_month': 1,
                'sequence': 40,
                'fallback': 'custom',
                'always_shown': True,
            }

    def _init_options_date(self, options, previous_options):
        """From the first to the last journal item, recomputed on every reload.

        A single-date report (balance sheet) receiving the filter from another
        report falls back to "today": the last entry may be a draft dated years
        ahead, "as of" that date would make no sense.
        """
        date = previous_options.get('date') or {}
        if date.get('fallback_from') != ALL_HISTORY:
            return super()._init_options_date(options, previous_options)
        if ALL_HISTORY not in options['filter_date']['filters']:
            return super()._init_options_date(options, {**previous_options, 'date': {'period_type': 'today'}})

        date_from, date_to = self._get_all_history_bounds()
        options['date'] = self._build_date_dict(
            options, date_from, date_to, 'custom', label=self.env._("All history"), fallback_from=ALL_HISTORY,
        )

    def _get_all_history_bounds(self):
        """First and last journal item date of the active companies, in one query.

        The end never stops before today, like the standard filters.
        """
        [(date_min, date_max)] = self.env['account.move.line']._read_group(
            [('company_id', 'in', self.env.companies.ids)],
            aggregates=['date:min', 'date:max'],
        )
        today = fields.Date.context_today(self)
        return date_min or today, max(date_max or today, today)
