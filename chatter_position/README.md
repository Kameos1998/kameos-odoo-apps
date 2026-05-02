# Chatter Position

Toggle the Odoo chatter between **side** and **bottom**, with a draggable
splitter to fine-tune how much room each pane takes.

## Why

By default Odoo decides the chatter position based on the viewport width:
side on huge screens, bottom otherwise. That breakpoint is fixed and not
always what you want. This module hands the choice back to the user, on
any screen size.

## Features

- Toggle button injected into every chatter topbar (next to Search).
- Two layouts: **side** (form left, chatter right) and **bottom** (full-width
  chatter under the form sheet).
- Draggable splitter between form and chatter when in side mode.
- Double-click the splitter to reset to a 60/40 ratio.
- Hard minimum widths so the chatter never gets too narrow to use
  (Send Message + Log Note always stay together on row 1).
- Topbar wraps to a second row instead of hiding buttons behind a
  horizontal scrollbar when the chatter is narrow.
- Smooth 180 ms transition on toggle and reset.
- 100 % static module: no model, no controller, no DB schema, no menu.

## How it works

The choice and the split ratio are stored in the browser via
``localStorage`` (keys ``chatter_position`` and ``chatter_split_ratio``).
Switching browsers or clearing cache resets the preference to default
(side, 60/40). No data is sent to the server.

## Public API

The module exposes a service registered as ``chatterPosition``::

    const cp = useService("chatterPosition");
    cp.getPosition();   // 'sided' or 'bottom'
    cp.toggle();        // switch position

## Compatibility

- Tested on Odoo 17.0, 18.0, 19.0 (Community and Enterprise).
- No conflicting patches with ``mail`` or ``web`` modules expected.

## License

LGPL-3.

## Author

[Kameos](https://kameos.be) — Belgian Odoo integrator specialised in custom
development for SMEs and non-profits. Found a bug or want a feature?
[Get in touch](https://kameos.be/contactus).
