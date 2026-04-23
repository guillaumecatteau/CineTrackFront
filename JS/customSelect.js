/**
 * customSelect.js — Lightweight accessible custom dropdown.
 *
 * The native <select> stays in the DOM (invisible) so all existing
 * .value reads and addEventListener('change', ...) calls keep working.
 *
 * Activate: add  data-custom-select="<border-radius>"  to a <select>.
 *   e.g.  <select data-custom-select="8px">
 *
 * To sync the visual label after a programmatic .value change, dispatch:
 *   nativeSelect.dispatchEvent(new Event('cselect:sync'))
 */

const _build = (native) => {
	const opts   = Array.from(native.options);
	const radius = native.dataset.customSelect || '6px';

	// ── Wrapper ────────────────────────────────────────────────
	const wrapper = document.createElement('div');
	wrapper.className = 'cselect';
	wrapper.style.setProperty('--cselect-radius', radius);

	// ── Trigger button ─────────────────────────────────────────
	const trigger = document.createElement('button');
	trigger.type = 'button';
	trigger.className = 'cselect-trigger';
	// Copy native classes so context CSS rules (e.g. .user-collection-filter) apply
	if (native.className) {
		native.className.split(' ').filter(Boolean).forEach(c => trigger.classList.add(c));
	}
	trigger.setAttribute('aria-haspopup', 'listbox');
	trigger.setAttribute('aria-expanded', 'false');

	const label = document.createElement('span');
	label.className = 'cselect-label';
	label.textContent = opts[native.selectedIndex]?.text ?? '';

	const chevron = document.createElement('span');
	chevron.className = 'cselect-chevron';
	chevron.setAttribute('aria-hidden', 'true');
	chevron.innerHTML = `<svg viewBox="0 0 10 6" width="10" height="6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>`;

	trigger.appendChild(label);
	trigger.appendChild(chevron);

	// ── Dropdown list ──────────────────────────────────────────
	const list = document.createElement('ul');
	list.className = 'cselect-list';
	list.setAttribute('role', 'listbox');

	// ── Sync display helper ───────────────────────────────────
	const _syncDisplay = (val) => {
		const matched = opts.find(o => o.value === val);
		if (matched) label.textContent = matched.text;
		list.querySelectorAll('.cselect-option').forEach(li =>
			li.classList.toggle('is-selected', li.dataset.value === val)
		);
	};

	opts.forEach((opt) => {
		const li = document.createElement('li');
		li.className = 'cselect-option';
		li.setAttribute('role', 'option');
		li.dataset.value = opt.value;
		li.textContent = opt.text;
		if (opt.value === native.value) li.classList.add('is-selected');

		li.addEventListener('click', () => {
			native.value = opt.value;
			_syncDisplay(opt.value);
			_close();
			// Dispatch change so existing listeners (collection.js, init.js) react
			native.dispatchEvent(new Event('change', { bubbles: true }));
		});

		list.appendChild(li);
	});

	// ── Open / close ───────────────────────────────────────────
	const _open = () => {
		wrapper.classList.add('is-open');
		trigger.setAttribute('aria-expanded', 'true');
	};

	const _close = () => {
		wrapper.classList.remove('is-open');
		trigger.setAttribute('aria-expanded', 'false');
	};

	trigger.addEventListener('click', (e) => {
		e.stopPropagation();
		wrapper.classList.contains('is-open') ? _close() : _open();
	});

	// Close when clicking outside
	document.addEventListener('click', (e) => {
		if (!wrapper.contains(e.target)) _close();
	});

	// Sync label when native value is set programmatically (no change event fires)
	native.addEventListener('cselect:sync', () => _syncDisplay(native.value));

	// ── Assemble ───────────────────────────────────────────────
	wrapper.appendChild(trigger);
	wrapper.appendChild(list);
	// Insert wrapper where native was, then move native inside (hidden)
	native.insertAdjacentElement('beforebegin', wrapper);
	native.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;';
	wrapper.appendChild(native);
};

/** Initialize all selects marked with [data-custom-select] within ctx. */
export const initCustomSelects = (ctx = document) => {
	ctx.querySelectorAll('[data-custom-select]').forEach(_build);
};
