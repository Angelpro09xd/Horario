/* ===========================================================================
   UI — helpers de DOM, iconos, modales y avisos
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});

  /* — Iconos (trazo, 24×24) ------------------------------------------------ */
  var ICONS = {
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkSquare: '<rect x="3" y="3" width="18" height="18" rx="4.5"/><path d="M7.8 12.4l2.8 2.8 5.6-5.8"/>',
    flame: '<path d="M12 2.6c3.7 3.3 6 6.1 6 9.7a6 6 0 0 1-12 0c0-2 .8-3.7 2.1-5.1.3 1.5 1.1 2.4 2.1 2.7.5-3 .9-5.2 1.8-7.3Z"/>',
    chart: '<path d="M3 20.5h18"/><rect x="4.5" y="11" width="3.6" height="6.5" rx="1.2"/><rect x="10.2" y="6" width="3.6" height="11.5" rx="1.2"/><rect x="15.9" y="9" width="3.6" height="8.5" rx="1.2"/>',
    book: '<path d="M5 4.6A2.6 2.6 0 0 1 7.6 2H19v20H7.6A2.6 2.6 0 0 1 5 19.4Z"/><path d="M5 17.6h14"/>',
    sliders: '<path d="M4 7.5h8M17.5 7.5H20M4 16.5h3.5M13 16.5h7"/><circle cx="14.8" cy="7.5" r="2.4"/><circle cx="10.2" cy="16.5" r="2.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.2 20.2-3.7-3.7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6.3 6.3 17.7 17.7M17.7 6.3 6.3 17.7"/>',
    trash: '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 12.6h9L17.5 7"/>',
    edit: '<path d="M4 20.2h4.2L19.4 9a2.2 2.2 0 0 0-3.1-3.1L5 17Z"/>',
    download: '<path d="M12 3v12m0 0 4.2-4.2M12 15l-4.2-4.2M4 20.5h16"/>',
    upload: '<path d="M12 21V9m0 0 4.2 4.2M12 9l-4.2 4.2M4 3.5h16"/>',
    bell: '<path d="M6 9.2a6 6 0 1 1 12 0c0 4 1.6 5.6 2.1 6.3H3.9C4.4 14.8 6 13.2 6 9.2Z"/><path d="M9.8 19.2a2.3 2.3 0 0 0 4.4 0"/>',
    sparkles: '<path d="m12 3 1.9 4.7L18.6 9.6l-4.7 1.9L12 16.2l-1.9-4.7-4.7-1.9 4.7-1.9Z"/><path d="m19 14.6.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>',
    expand: '<path d="M4 9.2V4h5.2M20 14.8V20h-5.2M14.8 4H20v5.2M9.2 20H4v-5.2"/>',
    shrink: '<path d="M9.4 4v5.4H4M14.6 20v-5.4H20M20 9.4h-5.4V4M4 14.6h5.4V20"/>',
    left: '<path d="M14.5 5 8 12l6.5 7"/>',
    right: '<path d="M9.5 5 16 12l-6.5 7"/>',
    zap: '<path d="M13.2 2.5 4.5 14.2h6.6l-1 7.3 8.6-11.8h-6.6Z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.6 20.2a6.4 6.4 0 0 1 12.8 0"/><path d="M16.4 5.2a3.5 3.5 0 0 1 0 6.4M17.8 14.4a6.4 6.4 0 0 1 3.7 5.8"/>',
    phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.8 18.6h2.4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.9"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.6h-4.6"/>',
    pin: '<path d="m14.5 3.5 6 6-3 1-4.2 4.2L13 18l-1.6 1.6-5-5L8 13l3.3-.3L15.5 8.5Z"/><path d="M7.5 16.5 3.5 20.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    star: '<path d="m12 3.6 2.6 5.5 5.9.8-4.3 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.5 9.9l5.9-.8Z"/>',
    coffee: '<path d="M4 8h12v6.5a4.5 4.5 0 0 1-9 0V8"/><path d="M16 9.2h1.8a2.6 2.6 0 0 1 0 5.2H16"/><path d="M4 20.5h12"/>',
    play: '<path d="M7 4.7 19 12 7 19.3Z"/>',
    pause: '<path d="M8.5 4.5v15M15.5 4.5v15"/>',
    home: '<path d="M4 10.5 12 3.5l8 7V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V10.5Z"/><path d="M9.5 21V14h5v7"/>',
    logo: '<path d="M4 4.5h16M4 4.5v15M20 4.5v15M4 19.5h16"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"/>'
  };

  function icon(name, size) {
    var p = ICONS[name] || ICONS.info;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (size ? ' width="' + size + '" height="' + size + '"' : '') + '>' + p + '</svg>';
  }

  /* — DOM ------------------------------------------------------------------ */
  /* Las propiedades personalizadas (--x) necesitan setProperty, no asignación. */
  function applyStyle(node, styles) {
    Object.keys(styles).forEach(function (k) {
      var v = styles[k];
      if (v == null) return;
      if (k.slice(0, 2) === '--') node.style.setProperty(k, String(v));
      else node.style[k] = v;
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') applyStyle(node, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return node;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function escapeHTML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  /* — Avisos --------------------------------------------------------------- */
  function toast(message, kind, ms) {
    var host = qs('.toasts') || document.body.appendChild(el('div', { class: 'toasts' }));
    var node = el('div', { class: 'toast glass', dataset: { kind: kind || 'info' } }, [
      el('span', { class: 'row', html: icon(kind === 'ok' ? 'check' : kind === 'bad' ? 'close' : kind === 'warn' ? 'bell' : 'sparkles') }),
      el('span', { class: 'grow', text: message })
    ]);
    host.appendChild(node);
    var t = setTimeout(hide, ms || 3200);
    node.addEventListener('click', hide);
    function hide() {
      clearTimeout(t);
      node.classList.add('out');
      setTimeout(function () { node.remove(); }, 320);
    }
    return hide;
  }

  /* — Modal ---------------------------------------------------------------- */
  var scrim = null, openModal = null, lastFocus = null;

  function ensureScrim() {
    if (!scrim) {
      scrim = el('div', { class: 'scrim', onclick: function () { closeModal(); } });
      document.body.appendChild(scrim);
    }
    return scrim;
  }

  function closeModal() {
    if (!openModal) return;
    var node = openModal;
    openModal = null;
    node.classList.remove('open');
    ensureScrim().classList.remove('open');
    setTimeout(function () { node.remove(); }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function modal(opts) {
    closeModal();
    lastFocus = document.activeElement;
    var body = el('div', { class: 'modal-body' }, opts.body || []);
    var foot = el('div', { class: 'modal-foot' }, (opts.actions || []).map(function (a) {
      return el('button', {
        class: 'btn ' + (a.kind || ''),
        type: 'button',
        onclick: function () { if (!a.onClick || a.onClick() !== false) closeModal(); }
      }, a.label);
    }));
    var node = el('div', {
      class: 'modal glass', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Diálogo'
    }, [
      el('div', { class: 'modal-head' }, [
        opts.icon ? el('span', { class: 'icon-btn', html: icon(opts.icon), style: { pointerEvents: 'none' } }) : null,
        el('div', { class: 'grow' }, [
          el('div', { class: 'modal-title', text: opts.title || '' }),
          opts.subtitle ? el('div', { class: 'view-sub', text: opts.subtitle }) : null
        ]),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cerrar', html: icon('close'), onclick: closeModal })
      ]),
      body,
      (opts.actions && opts.actions.length) ? foot : null
    ]);
    document.body.appendChild(node);
    ensureScrim().classList.add('open');
    requestAnimationFrame(function () { node.classList.add('open'); });
    openModal = node;
    var first = node.querySelector('input, select, textarea, button.primary');
    if (first) setTimeout(function () { first.focus(); }, 180);
    return { node: node, close: closeModal };
  }

  function confirm(title, message, danger) {
    return new Promise(function (resolve) {
      modal({
        title: title,
        icon: 'info',
        body: [el('p', { class: 'dim', text: message, style: { fontSize: '14px', lineHeight: '1.6' } })],
        actions: [
          { label: 'Cancelar', onClick: function () { resolve(false); } },
          { label: 'Confirmar', kind: danger ? 'danger' : 'primary', onClick: function () { resolve(true); } }
        ]
      });
    });
  }

  /* — Formularios ---------------------------------------------------------- */
  function field(label, control) {
    return el('div', { class: 'field' }, [el('label', { text: label }), control]);
  }

  function input(attrs) { return el('input', Object.assign({ class: 'input' }, attrs)); }
  function textarea(attrs) { return el('textarea', Object.assign({ class: 'textarea' }, attrs)); }

  function select(attrs, options, value) {
    var node = el('select', Object.assign({ class: 'select' }, attrs));
    options.forEach(function (o) {
      node.appendChild(el('option', { value: o.value, text: o.label, selected: String(o.value) === String(value) }));
    });
    node.value = value != null ? value : node.value;
    return node;
  }

  function switchRow(label, hint, checked, onChange) {
    var inp = el('input', { type: 'checkbox', checked: !!checked, onchange: function () { onChange(inp.checked); } });
    return el('label', { class: 'switch' }, [
      inp,
      el('span', { class: 'track' }),
      el('span', { class: 'grow' }, [
        el('div', { class: 'label', text: label }),
        hint ? el('div', { class: 'hint', text: hint }) : null
      ])
    ]);
  }

  function ring(percent, color, inner, size) {
    var style = { '--p': String(percent), '--c': color || 'var(--accent)' };
    if (size) style['--size'] = size + 'px';   /* sin tamaño → manda el CSS */
    return el('div', { class: 'ring', style: style }, el('div', {}, inner));
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModal) { e.stopPropagation(); closeModal(); }
  });

  HX.ui = {
    ICONS: ICONS, icon: icon, el: el, applyStyle: applyStyle, qs: qs, qsa: qsa, clear: clear, escapeHTML: escapeHTML,
    toast: toast, modal: modal, closeModal: closeModal, confirm: confirm,
    field: field, input: input, textarea: textarea, select: select, switchRow: switchRow, ring: ring
  };
})(window);
