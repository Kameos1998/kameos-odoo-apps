# Chatter Position

Toggle the Odoo chatter between **side** and **bottom**, with a draggable
splitter to fine-tune how much room each pane takes.

## Why

By default Odoo decides the chatter position based on the viewport width:
side on huge screens, bottom otherwise. That breakpoint is fixed and not
always what you want. This module hands the choice back to the user, on
any desktop screen size.

## Features

- Toggle button in every chatter topbar (next to Search).
- Two layouts: **side** (form and chatter side by side) and **bottom**
  (full-width chatter under a full-width form).
- Draggable splitter between form and chatter in side mode; double-click
  it to reset the width (chatter at 40 %).
- Minimum widths (320 px) keep both panes usable.
- Odoo keeps its own layout on phones (< 768 px), in dialogs and next to
  attachment previews (vendor bills with their PDF).
- Translated in English, French, Dutch, German and Spanish; right-to-left
  languages mirror the layout and the splitter; theme colors and dark mode
  are followed.
- 100 % static module: no model, no controller, no DB schema, no menu.

## How it works

The choice and the chatter width are stored in the browser via
`localStorage` (keys `chatter_position` and `chatter_position_width`).
Clearing site data resets the preference to default (side, 40 %).
No data is sent to the server.

The layout itself is Odoo's: the module only changes the answer of
`FormRenderer.mailLayout()` and the `o_xxl_form_view` class of
`FormController`, both read from one Owl signal, so toggling re-renders the
open forms with no DOM patching.

## Public API

The module exposes a service registered as `chatterPosition`:

    const cp = useService("chatterPosition");
    cp.getPosition();   // 'sided' or 'bottom'
    cp.toggle();        // switch position

## Visual check (to redo on each Odoo version)

On a record with a chatter (CRM opportunity) and on a vendor bill with its
PDF, at 1600 px, 1100 px and 600 px wide:

1. Side: chatter on the right, splitter on its edge, form fills the rest.
2. Toggle: chatter below, form and chatter full width.
3. Drag the splitter, reload: width kept. Double-click: back to 40 %.
4. 600 px: no button, no splitter, Odoo's stacked layout.
5. Vendor bill at 1600 px: PDF preview readable, no button.
6. Arabic user: chatter on the left, splitter mirrored.

## Compatibility

Odoo 20.0, Community and Enterprise.

## License

LGPL-3.

## Author

[Kameos](https://kameos.be) — Belgian Odoo integrator specialised in custom
development for SMEs and non-profits. Found a bug or want a feature?
[Get in touch](https://kameos.be/contactus).
