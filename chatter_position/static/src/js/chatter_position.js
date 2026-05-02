/** @odoo-module **/

import { registry } from "@web/core/registry";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { FormController } from "@web/views/form/form_controller";
import { FormRenderer } from "@web/views/form/form_renderer";

let chatterPosition = localStorage.getItem('chatter_position') || 'sided';

// Default split ratio used on first load and when the user double-clicks
// the splitter to reset.
const DEFAULT_SPLIT_RATIO = 0.6;
// Toggle / reset CSS transition duration (must match chatter_position.css).
const TOGGLE_TRANSITION_MS = 180;
// Hard pixel floors mirroring the CSS rules. The chatter min keeps
// Send Message + Log Note on a single row; the form sheet min keeps the
// form usable.
const MIN_CHATTER_PX = 240;
const MIN_SHEET_PX = 320;

function updateBodyClass() {
    if (!document.body) return;
    document.body.classList.toggle('chatter-bottom', chatterPosition === 'bottom');
    document.body.classList.toggle('chatter-side', chatterPosition === 'sided');
}

function applyLayoutToDOM() {
    const renderers = document.querySelectorAll('.o_form_renderer');
    renderers.forEach(renderer => {
        const sheetBg = renderer.querySelector('.o_form_sheet_bg');
        const chatter = renderer.querySelector('.o-mail-Form-chatter');

        if (chatterPosition === 'bottom') {
            renderer.style.setProperty('flex-direction', 'column', 'important');
            renderer.style.setProperty('flex-wrap', 'nowrap', 'important');
            if (sheetBg) {
                sheetBg.style.setProperty('width', '100%', 'important');
                sheetBg.style.setProperty('max-width', '100%', 'important');
            }
            if (chatter) {
                chatter.style.setProperty('width', '100%', 'important');
                chatter.style.setProperty('max-width', '100%', 'important');
            }
        } else {
            // Native Odoo re-adds 'flex-column' on the renderer when the
            // viewport drops below the xxl breakpoint, which collapses the
            // side layout. Remove it so the user's preference wins.
            renderer.classList.remove('flex-column');
            renderer.style.removeProperty('flex-direction');
            renderer.style.removeProperty('flex-wrap');
            if (sheetBg) {
                sheetBg.style.removeProperty('width');
                sheetBg.style.removeProperty('max-width');
            }
            if (chatter) {
                chatter.style.removeProperty('width');
                chatter.style.removeProperty('max-width');
            }
        }
    });

    document.querySelectorAll('.o_form_view').forEach(fv => {
        if (chatterPosition === 'bottom') {
            fv.classList.remove('o_xxl_form_view');
        }
    });
}

function triggerLayoutReflow() {
    // Force Odoo's list renderer / form controller / chatter components
    // to recompute their cached widths. They listen to the window resize
    // event via ResizeObserver and useEffect hooks.
    window.dispatchEvent(new Event('resize'));
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
    });
}

function withToggleTransition(fn) {
    document.body.classList.add('chatter-toggling');
    fn();
    setTimeout(() => {
        document.body.classList.remove('chatter-toggling');
        triggerLayoutReflow();
    }, TOGGLE_TRANSITION_MS);
}

function toggleChatterPosition() {
    document.body.classList.add('chatter-toggling');
    chatterPosition = chatterPosition === 'bottom' ? 'sided' : 'bottom';
    localStorage.setItem('chatter_position', chatterPosition);
    updateBodyClass();
    applyLayoutToDOM();
    updateAllToggleButtons();

    if (chatterPosition === 'sided') {
        // Inject splitters and apply the saved ratio.
        document.querySelectorAll('.o_form_renderer').forEach(renderer => {
            // Drop the inline styles set in bottom mode and the
            // 'flex-column' class Odoo re-injects below the xxl breakpoint.
            renderer.classList.remove('flex-column');
            renderer.style.removeProperty('flex-direction');
            renderer.style.removeProperty('flex-wrap');
            const sheetBg = renderer.querySelector('.o_form_sheet_bg');
            const chatter = renderer.querySelector('.o-mail-Form-chatter');
            if (sheetBg) {
                sheetBg.style.removeProperty('width');
                sheetBg.style.removeProperty('max-width');
            }
            if (chatter) {
                chatter.style.removeProperty('width');
                chatter.style.removeProperty('max-width');
            }
            injectSplitter(renderer);
            const ratio = parseFloat(localStorage.getItem('chatter_split_ratio'))
                || DEFAULT_SPLIT_RATIO;
            applySplitRatio(renderer, ratio);
        });
        // Force the form view into xxl mode so Odoo lays it out horizontally.
        document.querySelectorAll('.o_form_view').forEach(fv => {
            fv.classList.add('o_xxl_form_view');
        });
    } else {
        // Drop the splitters in bottom mode.
        document.querySelectorAll('.o-chatter-splitter').forEach(s => s.remove());
        document.querySelectorAll('.o_form_view').forEach(fv => {
            fv.classList.remove('o_xxl_form_view');
        });
    }

    setTimeout(() => {
        document.body.classList.remove('chatter-toggling');
        triggerLayoutReflow();
    }, TOGGLE_TRANSITION_MS);
}

// Init
if (document.body) {
    updateBodyClass();
} else {
    document.addEventListener('DOMContentLoaded', updateBodyClass);
}

// Patch FormController — manages o_xxl_form_view depending on the chosen
// chatter position.
patch(FormController.prototype, {
    get className() {
        const result = super.className;
        if (result && typeof result === 'object') {
            if (chatterPosition === 'bottom') {
                // Strip xxl so the form falls back to a single-column layout.
                for (const key of Object.keys(result)) {
                    if (key.includes('xxl_form_view')) {
                        delete result[key];
                    }
                }
            } else {
                // Force xxl so the side layout works at any viewport size.
                result["o_xxl_form_view h-100"] = true;
            }
        }
        return result;
    },
});

// Patch FormRenderer — force the chatter layout depending on the chosen
// position.
patch(FormRenderer.prototype, {
    mailLayout(hasAttachmentContainer) {
        const hasFile = typeof this.hasFile === 'function' ? this.hasFile() : false;
        const hasChatter = !!this.mailStore;

        if (chatterPosition === 'bottom') {
            if (hasChatter) {
                return (hasAttachmentContainer && hasFile) ? "COMBO" : "BOTTOM_CHATTER";
            }
            return "NONE";
        }

        // Side mode: force SIDE_CHATTER or COMBO.
        if (hasChatter) {
            if (hasAttachmentContainer && hasFile) {
                return "COMBO";
            }
            return "SIDE_CHATTER";
        }
        return "NONE";
    },
});

// Inline styles needed before the asset bundle is rendered (e.g. on
// the very first paint, while the static CSS is still loading).
const style = document.createElement('style');
style.id = 'chatter-position-styles';
style.textContent = `
    body.chatter-bottom .o_form_renderer {
        flex-direction: column !important;
        flex-wrap: nowrap !important;
        height: auto !important;
        min-height: 100% !important;
        overflow-x: hidden !important;
    }
    body.chatter-bottom .o_form_sheet_bg {
        flex: 1 1 auto !important;
        width: 100% !important;
        max-width: 100% !important;
    }
    body.chatter-bottom .o-mail-Form-chatter {
        flex: 0 0 auto !important;
        width: 100% !important;
        max-width: 100% !important;
    }
    body.chatter-bottom .o_form_view_container,
    body.chatter-bottom .o_content {
        overflow-x: hidden !important;
    }
    .o-chatter-position-toggle {
        cursor: pointer;
        transition: color 0.2s;
    }
    .o-chatter-position-toggle:hover {
        color: var(--o-main-text-color) !important;
    }

    /* ---- Splitter (side mode) ---- */
    body.chatter-side .o_form_renderer {
        flex-wrap: nowrap !important;
    }
    .o-chatter-splitter {
        flex: 0 0 5px;
        cursor: col-resize;
        background: var(--o-border-color, #dee2e6);
        transition: background 0.15s;
        position: relative;
        z-index: 10;
        align-self: stretch;
    }
    .o-chatter-splitter:hover,
    .o-chatter-splitter.active {
        background: var(--o-main-color, #714B67);
    }
    .o-chatter-splitter::after {
        content: '\\2807';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--o-text-muted, #888);
        font-size: 14px;
        pointer-events: none;
    }
    .o-chatter-splitter:hover::after,
    .o-chatter-splitter.active::after {
        color: white;
    }
    body.chatter-resizing {
        cursor: col-resize !important;
        user-select: none !important;
    }
    body.chatter-resizing * {
        cursor: col-resize !important;
        user-select: none !important;
    }
`;
document.head.appendChild(style);

// ====================================================
// Toggle button injected into the chatter topbar
// ====================================================

function updateAllToggleButtons() {
    document.querySelectorAll('.o-chatter-position-toggle').forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = chatterPosition === 'bottom' ? 'fa fa-columns' : 'fa fa-arrows-v';
        }
        btn.title = chatterPosition === 'bottom'
            ? _t("Move chatter to the side")
            : _t("Move chatter to the bottom");
    });
}

function injectToggleButton(topbar) {
    if (topbar.querySelector('.o-chatter-position-toggle')) return;

    // Insert just before the search button (look for any localized
    // aria-label that contains the "search" stem).
    const searchBtn = topbar.querySelector(
        'button[aria-label*="earch"], button[aria-label*="echerch"]'
    );
    if (!searchBtn) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'o-chatter-position-toggle btn btn-link text-action px-1';
    toggleBtn.title = chatterPosition === 'bottom'
        ? _t("Move chatter to the side")
        : _t("Move chatter to the bottom");

    const icon = document.createElement('i');
    icon.className = chatterPosition === 'bottom' ? 'fa fa-columns' : 'fa fa-arrows-v';
    icon.setAttribute('role', 'img');
    toggleBtn.appendChild(icon);

    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleChatterPosition();
    });

    searchBtn.parentNode.insertBefore(toggleBtn, searchBtn);
}

// ====================================================
// Draggable splitter (side mode only)
// ====================================================

const savedRatio = parseFloat(localStorage.getItem('chatter_split_ratio'))
    || DEFAULT_SPLIT_RATIO;

function injectSplitter(renderer) {
    if (renderer.querySelector('.o-chatter-splitter')) return;
    const sheetBg = renderer.querySelector('.o_form_sheet_bg');
    const chatter = renderer.querySelector('.o-mail-Form-chatter');
    if (!sheetBg || !chatter) return;

    const splitter = document.createElement('div');
    splitter.className = 'o-chatter-splitter';
    splitter.title = _t("Drag to resize — double-click to reset");
    sheetBg.after(splitter);

    splitter.addEventListener('dblclick', (e) => {
        if (chatterPosition !== 'sided') return;
        e.preventDefault();
        e.stopPropagation();
        withToggleTransition(() => {
            applySplitRatio(renderer, DEFAULT_SPLIT_RATIO);
            localStorage.setItem(
                'chatter_split_ratio',
                DEFAULT_SPLIT_RATIO.toFixed(3),
            );
        });
    });

    if (chatterPosition === 'sided') {
        applySplitRatio(renderer, savedRatio);
    }

    let isDragging = false;

    splitter.addEventListener('mousedown', (e) => {
        if (chatterPosition !== 'sided') return;
        e.preventDefault();
        isDragging = true;
        splitter.classList.add('active');
        document.body.classList.add('chatter-resizing');

        const onMouseMove = (ev) => {
            if (!isDragging) return;
            const rect = renderer.getBoundingClientRect();
            const ratio = (ev.clientX - rect.left) / rect.width;
            // applySplitRatio enforces pixel-based min widths.
            applySplitRatio(renderer, ratio);
        };

        const onMouseUp = () => {
            isDragging = false;
            splitter.classList.remove('active');
            document.body.classList.remove('chatter-resizing');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const rect = renderer.getBoundingClientRect();
            const sheet = renderer.querySelector('.o_form_sheet_bg');
            if (sheet) {
                const currentRatio = sheet.getBoundingClientRect().width / rect.width;
                localStorage.setItem('chatter_split_ratio', currentRatio.toFixed(3));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function applySplitRatio(renderer, ratio) {
    const sheetBg = renderer.querySelector('.o_form_sheet_bg');
    const chatter = renderer.querySelector('.o-mail-Form-chatter');
    if (!sheetBg || !chatter) return;

    const splitterWidth = 5;
    const totalWidth = renderer.getBoundingClientRect().width;
    if (totalWidth > 0) {
        const maxRatio = 1 - (MIN_CHATTER_PX + splitterWidth) / totalWidth;
        const minRatio = MIN_SHEET_PX / totalWidth;
        if (maxRatio > minRatio) {
            ratio = Math.max(minRatio, Math.min(maxRatio, ratio));
        } else {
            // Viewport too narrow to honor both floors: 50/50 fallback.
            ratio = 0.5;
        }
    }
    const sheetPct = (ratio * 100).toFixed(1);
    const chatterPct = ((1 - ratio) * 100).toFixed(1);

    sheetBg.style.setProperty('flex', `0 0 calc(${sheetPct}% - ${splitterWidth / 2}px)`, 'important');
    sheetBg.style.setProperty('max-width', `calc(${sheetPct}% - ${splitterWidth / 2}px)`, 'important');
    sheetBg.style.setProperty('width', `calc(${sheetPct}% - ${splitterWidth / 2}px)`, 'important');
    sheetBg.style.setProperty('overflow-y', 'auto', 'important');

    chatter.style.setProperty('flex', `0 0 calc(${chatterPct}% - ${splitterWidth / 2}px)`, 'important');
    chatter.style.setProperty('max-width', `calc(${chatterPct}% - ${splitterWidth / 2}px)`, 'important');
    chatter.style.setProperty('width', `calc(${chatterPct}% - ${splitterWidth / 2}px)`, 'important');
}

// Observer — re-applies the layout when Odoo re-renders forms (e.g. when
// the user navigates between records or resizes the window).
const observer = new MutationObserver(() => {
    if (chatterPosition === 'bottom') {
        applyLayoutToDOM();
        document.querySelectorAll('.o-chatter-splitter').forEach(s => s.style.display = 'none');
    } else {
        document.querySelectorAll('.o_form_renderer').forEach(renderer => {
            // Strip flex-column re-injected by Odoo on viewport resize.
            renderer.classList.remove('flex-column');
            injectSplitter(renderer);
            const splitter = renderer.querySelector('.o-chatter-splitter');
            if (splitter) splitter.style.display = '';
            const ratio = parseFloat(localStorage.getItem('chatter_split_ratio'))
                || DEFAULT_SPLIT_RATIO;
            applySplitRatio(renderer, ratio);
        });
    }
    document.querySelectorAll('.o-mail-Chatter-topbar').forEach(topbar => {
        injectToggleButton(topbar);
    });
});

if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

// Public service so other modules can read or toggle the position.
registry.category("services").add("chatterPosition", {
    dependencies: [],
    start() {
        return {
            getPosition: () => chatterPosition,
            toggle: toggleChatterPosition,
        };
    },
});
