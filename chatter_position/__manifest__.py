{
    'name': 'Chatter Position',
    'version': '20.0.1.0.0',
    'category': 'Productivity',
    'summary': 'Toggle the chatter between side and bottom, with a draggable splitter.',
    'description': """
Chatter Position
================

Adds a small button to every chatter topbar that toggles between two
layouts:

* **Side chatter** (default): the chatter sits next to the form, with a
  draggable splitter to adjust its width. Double-click the splitter to
  reset it.
* **Bottom chatter**: the chatter spans the full form width below the
  form sheet.

Layout choice and chatter width are persisted per browser via
``localStorage`` — no server-side preference, no database changes,
no model created.

Odoo keeps its own layout where it knows better: on small screens, in
dialogs and next to attachment previews.

A public service ``chatterPosition`` is exposed in the registry so other
modules can read or toggle the position programmatically.
    """,
    'author': 'Kameos',
    'website': 'https://kameos.be',
    'support': 'info@kameos.be',
    'license': 'LGPL-3',
    'depends': ['mail'],
    'assets': {
        'web.assets_backend': [
            'chatter_position/static/src/**/*',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
