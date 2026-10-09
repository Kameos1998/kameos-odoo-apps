from odoo import fields, models

ALL_HISTORY = 'all_history'


class AccountReport(models.Model):
    _inherit = 'account.report'

    def _init_options_date(self, options, previous_options):
        """Date filter `all_history`: from the first to the last journal item.

        The standard knows no open-ended period: a filter it does not recognize
        leaves the options without dates and `_get_dates_period` crashes. The
        filter is therefore translated into custom dates before calling the
        standard, then put back in the options, so the menu shows it selected.
        The bounds are recomputed on every reload: an entry posted in the
        meantime widens the range.

        A single-date report (balance sheet) receiving the filter from another
        report falls back to "today": the last entry may be a draft dated years
        ahead, "as of" that date would make no sense.
        """
        date = previous_options.get('date') or {}
        if date.get('filter') != ALL_HISTORY:
            return super()._init_options_date(options, previous_options)
        if not self.filter_date_range:
            return super()._init_options_date(options, {**previous_options, 'date': {**date, 'filter': 'today'}})

        date_from, date_to = self._get_all_history_bounds()
        super()._init_options_date(options, {
            **previous_options,
            'date': {
                **date,
                'filter': 'custom',
                'date_from': fields.Date.to_string(date_from),
                'date_to': fields.Date.to_string(date_to),
            },
        })
        options['date']['filter'] = ALL_HISTORY
        options['date']['string'] = self.env._("All history")

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
