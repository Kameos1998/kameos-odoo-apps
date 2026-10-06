import { signal } from "@odoo/owl";
import { Chatter } from "@mail/chatter/web_portal_project/chatter";
import { browser } from "@web/core/browser/browser";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { FormController } from "@web/views/form/form_controller";
import { FormRenderer } from "@web/views/form/form_renderer";

// Per-browser preferences (localStorage): no model, no server round-trip.
const POSITION_KEY = "chatter_position";
const WIDTH_KEY = "chatter_position_width";

// Read during render by the form controller, the form renderer and the
// chatter: toggling re-renders all of them, nothing else is needed.
const position = signal(browser.localStorage.getItem(POSITION_KEY) === "bottom" ? "bottom" : "sided");

// The statusbar folds its stages to the available width on window resize
// only: tell it the form width changed, once the new layout is rendered.
function notifyResize() {
    browser.requestAnimationFrame(() => browser.setTimeout(() => browser.dispatchEvent(new Event("resize"))));
}

function togglePosition() {
    position.set(position() === "bottom" ? "sided" : "bottom");
    browser.localStorage.setItem(POSITION_KEY, position());
    notifyResize();
}

// Chatter width in the side layout, in % of the form. A CSS variable rather
// than a signal: resizing must not re-render the form.
function setWidth(pct) {
    const style = document.documentElement.style;
    if (pct) {
        style.setProperty("--ChatterPosition-width", `${pct}%`);
    } else {
        style.removeProperty("--ChatterPosition-width");
    }
}
setWidth(browser.localStorage.getItem(WIDTH_KEY));

/**
 * The webclient keeps its own layout on small screens, in dialogs and around
 * attachment previews (COMBO / EXTERNAL_COMBO: their styles only apply to the
 * layout core chose). The preference applies everywhere else.
 */
patch(FormRenderer.prototype, {
    mailLayout(hasAttachmentContainer) {
        const layout = super.mailLayout(hasAttachmentContainer);
        if (
            !["SIDE_CHATTER", "BOTTOM_CHATTER"].includes(layout) ||
            this.uiService.isSmall ||
            this.env.inDialog ||
            (hasAttachmentContainer && this.hasFile())
        ) {
            return layout;
        }
        return position() === "bottom" ? "BOTTOM_CHATTER" : "SIDE_CHATTER";
    },
});

patch(FormController.prototype, {
    get className() {
        const result = super.className;
        const arch = this.archInfo.xmlDoc;
        // Limit: a view declaring an attachment preview keeps core's layout
        // even with no file attached (the controller cannot know).
        if (
            this.ui.isSmall ||
            this.env.inDialog ||
            !arch.querySelector("chatter") ||
            arch.querySelector(".o_attachment_preview")
        ) {
            return result;
        }
        // One key, two classes: the side layout needs both (scrolling panes).
        result["o_xxl_form_view h-100"] = position() === "sided";
        return result;
    },
});

patch(Chatter.prototype, {
    get chatterPositionToggle() {
        // One glyph (a panel docked to an edge), turned towards the target position.
        return position() === "bottom"
            ? { dock: "o-ChatterPosition-toSide", title: _t("Move chatter to the side") }
            : { dock: "o-ChatterPosition-toBottom", title: _t("Move chatter to the bottom") };
    },
    toggleChatterPosition() {
        togglePosition();
    },
    onChatterSplitterPointerDown(ev) {
        ev.preventDefault();
        const splitter = ev.currentTarget;
        const form = splitter.closest(".o-mail-Form-chatter").parentElement;
        const rtl = getComputedStyle(form).direction === "rtl";
        let pct;
        const onMove = ({ clientX }) => {
            const { left, right, width } = form.getBoundingClientRect();
            pct = ((rtl ? clientX - left : right - clientX) / width) * 100;
            setWidth(pct.toFixed(1));
        };
        splitter.setPointerCapture(ev.pointerId);
        splitter.addEventListener("pointermove", onMove);
        splitter.addEventListener(
            "lostpointercapture",
            () => {
                splitter.removeEventListener("pointermove", onMove);
                if (pct) {
                    browser.localStorage.setItem(WIDTH_KEY, pct.toFixed(1));
                    notifyResize();
                }
            },
            { once: true }
        );
    },
    onChatterSplitterDblClick() {
        browser.localStorage.removeItem(WIDTH_KEY);
        setWidth(null);
        notifyResize();
    },
});

// Lets other modules read or toggle the position.
registry.category("services").add("chatterPosition", {
    start: () => ({ getPosition: () => position(), toggle: togglePosition }),
});
