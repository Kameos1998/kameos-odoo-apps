{
    'name': 'Accounting Reports: All History',
    'version': '19.0.1.0.0',
    'category': 'Accounting/Accounting',
    'summary': 'One click to show the whole history in the general ledger, trial balance, P&L and partner ledger.',
    'description': """
Accounting Reports: All History
===============================

The date filter of the accounting reports only offers month, quarter, year and
custom dates: showing the full history of an account in the general ledger
means typing two dates by hand.

This module adds an **All history** entry to the date filter of every
period-based report (general ledger, trial balance, profit and loss, partner
ledger, aged balances...). The range goes from the first to the last journal
item of the active companies and is recomputed on every reload.

Single-date reports (balance sheet) do not show the entry; if they inherit it
from another report, they fall back to today.

No configuration, no new model, no database change.
    """,
    'author': 'Kameos',
    'website': 'https://kameos.be',
    'support': 'info@kameos.be',
    'license': 'LGPL-3',
    'depends': ['account_reports'],
    'assets': {
        'web.assets_backend': [
            'account_report_all_history/static/src/**/*',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
