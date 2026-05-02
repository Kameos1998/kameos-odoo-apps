{
    'name': 'Chatter Position',
    'version': '18.0.1.0.1',
    'category': 'Productivity',
    'summary': 'Toggle the chatter between side and bottom, with a draggable splitter.',
    'description': """
Chatter Position
================

Adds a small button to every chatter topbar that toggles between two
layouts:

* **Side chatter** (default): the chatter sits to the right of the
  form, with a draggable splitter to adjust the form/chatter ratio.
  Double-click the splitter to reset to 60/40.
* **Bottom chatter**: the chatter spans the full form width below
  the form sheet.

Layout choice and split ratio are persisted per browser via
``localStorage`` — no server-side preference, no database changes,
no model created.

Other niceties
--------------

* Topbar wraps onto a second row when the chatter is too narrow
  (Send Message and Log Note stay together on row 1).
* Hard min-width on the chatter so the primary actions remain
  reachable at any viewport size.
* Smooth 180 ms transition on toggle and on splitter reset.
* Public service ``chatterPosition`` exposed in the registry so other
  modules can read or toggle the position programmatically.
    """,
    'author': 'Kameos',
    'website': 'https://kameos.be',
    'support': 'info@kameos.be',
    'license': 'LGPL-3',
    'depends': [
        'mail',
        'web',
    ],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'chatter_position/static/src/css/chatter_position.css',
            'chatter_position/static/src/js/chatter_position.js',
        ],
    },
    'images': [
        'static/description/banner.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
