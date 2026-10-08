/**
 * AhlanCalendar - Custom Orange/White Theme Calendar Widget
 * Drop-in replacement for <input type="date"> fields
 * Usage: AhlanCalendar.init()
 */
(function(global) {
  'use strict';

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  let activeInput  = null;
  let activeHidden = null;
  let activeMode   = 'single'; // 'single' | 'range-start' | 'range-end'
  let rangeStart   = null;
  let rangeEnd     = null;
  let linkedPicker = null; // partner input for return date

  // ── Build DOM ──────────────────────────────────────────────────
  function buildPicker() {
    if (document.getElementById('ahlan-cal')) return;

    const css = `
      #ahlan-cal-overlay {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9000;
        background: transparent;
      }
      #ahlan-cal {
        position: fixed;
        z-index: 99999;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(255,107,0,0.12);
        font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
        overflow: hidden;
        width: 300px;
        animation: calPop .18s ease both;
      }
      @keyframes calPop {
        from { opacity:0; transform: scale(.95) translateY(6px); }
        to   { opacity:1; transform: scale(1)   translateY(0);   }
      }
      .ac-header {
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c3a 100%);
        padding: 18px 20px 14px;
        color: #fff;
      }
      .ac-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }
      .ac-nav-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        transition: background .2s;
        flex-shrink: 0;
      }
      .ac-nav-btn:hover { background: rgba(255,255,255,0.35); }
      .ac-month-label {
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: .01em;
        cursor: pointer;
        user-select: none;
      }
      .ac-selected-label {
        font-size: 0.78rem;
        opacity: .85;
        min-height: 18px;
      }
      .ac-days-header {
        display: grid;
        grid-template-columns: repeat(7,1fr);
        padding: 12px 16px 4px;
        gap: 2px;
      }
      .ac-days-header span {
        text-align: center;
        font-size: .72rem;
        font-weight: 700;
        color: #ff6b00;
        text-transform: uppercase;
      }
      .ac-grid {
        display: grid;
        grid-template-columns: repeat(7,1fr);
        padding: 0 12px 14px;
        gap: 3px;
      }
      .ac-day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: .82rem;
        border-radius: 50%;
        cursor: pointer;
        transition: background .15s, color .15s;
        font-weight: 500;
        color: #1a1a1a;
        position: relative;
      }
      .ac-day:hover:not(.ac-empty):not(.ac-disabled) {
        background: #fff0e6;
        color: #ff6b00;
      }
      .ac-day.ac-today {
        border: 2px solid #ff6b00;
        color: #ff6b00;
        font-weight: 700;
      }
      .ac-day.ac-selected {
        background: #ff6b00 !important;
        color: #fff !important;
        font-weight: 700;
      }
      .ac-day.ac-range-mid {
        background: #fff0e6;
        border-radius: 0;
        color: #ff6b00;
      }
      .ac-day.ac-range-start {
        background: #ff6b00;
        color: #fff;
        font-weight: 700;
        border-radius: 50% 0 0 50%;
      }
      .ac-day.ac-range-end {
        background: #ff6b00;
        color: #fff;
        font-weight: 700;
        border-radius: 0 50% 50% 0;
      }
      .ac-day.ac-range-start.ac-range-end {
        border-radius: 50%;
      }
      .ac-day.ac-disabled {
        color: #ccc;
        cursor: default;
      }
      .ac-day.ac-empty { cursor: default; }
      .ac-footer {
        border-top: 1px solid #f1f5f9;
        padding: 10px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .ac-btn-clear {
        background: none;
        border: 1px solid #e2e8f0;
        color: #888;
        padding: 7px 14px;
        border-radius: 10px;
        font-size: .8rem;
        cursor: pointer;
        font-family: inherit;
        transition: all .2s;
      }
      .ac-btn-clear:hover { border-color: #ff6b00; color: #ff6b00; }
      .ac-btn-done {
        background: #ff6b00;
        border: none;
        color: #fff;
        padding: 8px 20px;
        border-radius: 10px;
        font-size: .8rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background .2s;
      }
      .ac-btn-done:hover { background: #e55a00; }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'ahlan-cal-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    const overlay = document.createElement('div');
    overlay.id = 'ahlan-cal-overlay';
    document.body.appendChild(overlay);

    const cal = document.createElement('div');
    cal.id = 'ahlan-cal';
    cal.innerHTML = `
      <div class="ac-header">
        <div class="ac-header-top">
          <button class="ac-nav-btn" id="ac-prev">&#8249;</button>
          <span class="ac-month-label" id="ac-month-label"></span>
          <button class="ac-nav-btn" id="ac-next">&#8250;</button>
        </div>
        <div class="ac-selected-label" id="ac-selected-label"></div>
      </div>
      <div class="ac-days-header" id="ac-days-header"></div>
      <div class="ac-grid" id="ac-grid"></div>
      <div class="ac-footer">
        <button class="ac-btn-clear" id="ac-clear">Clear</button>
        <button class="ac-btn-done" id="ac-done">Done</button>
      </div>
    `;
    document.body.appendChild(cal);
    cal.style.display = 'none';

    // Day headers
    const dh = document.getElementById('ac-days-header');
    DAYS.forEach(d => {
      const s = document.createElement('span');
      s.textContent = d;
      dh.appendChild(s);
    });

    document.getElementById('ac-prev').addEventListener('click', () => { state.month--; if(state.month<0){state.month=11;state.year--;} render(); });
    document.getElementById('ac-next').addEventListener('click', () => { state.month++; if(state.month>11){state.month=0;state.year++;} render(); });
    document.getElementById('ac-clear').addEventListener('click', clearPicker);
    document.getElementById('ac-done').addEventListener('click', closePicker);
    overlay.addEventListener('click', closePicker);
  }

  // ── State ──────────────────────────────────────────────────────
  const state = { year: 2025, month: 0 };

  function today() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }

  function toISO(y,m,d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  function formatDisplay(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-').map(Number);
    return `${MONTHS[m-1]} ${d}, ${y}`;
  }

  // ── Render ─────────────────────────────────────────────────────
  function render() {
    const t = today();
    document.getElementById('ac-month-label').textContent = `${MONTHS[state.month]} ${state.year}`;

    // Selected label
    let lbl = '';
    if (activeMode === 'single' && rangeStart) lbl = formatDisplay(rangeStart);
    else if (rangeStart && rangeEnd) lbl = `${formatDisplay(rangeStart)}  →  ${formatDisplay(rangeEnd)}`;
    else if (rangeStart) lbl = `${formatDisplay(rangeStart)}  →  ?`;
    document.getElementById('ac-selected-label').textContent = lbl;

    const grid = document.getElementById('ac-grid');
    grid.innerHTML = '';

    const firstDay = new Date(state.year, state.month, 1).getDay();
    const daysInMonth = new Date(state.year, state.month+1, 0).getDate();

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      const el = document.createElement('div');
      el.className = 'ac-day ac-empty';
      grid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(state.year, state.month, d);
      const el  = document.createElement('div');
      el.className = 'ac-day';
      el.textContent = d;

      const isPast = (state.year < t.y) ||
                     (state.year === t.y && state.month < t.m) ||
                     (state.year === t.y && state.month === t.m && d < t.d);

      if (isPast) { el.classList.add('ac-disabled'); }
      if (state.year === t.y && state.month === t.m && d === t.d) el.classList.add('ac-today');

      // Range highlighting
      if (rangeStart && rangeEnd) {
        if (iso === rangeStart && iso === rangeEnd) el.classList.add('ac-selected');
        else if (iso === rangeStart) el.classList.add('ac-range-start');
        else if (iso === rangeEnd)   el.classList.add('ac-range-end');
        else if (iso > rangeStart && iso < rangeEnd) el.classList.add('ac-range-mid');
      } else if (rangeStart && iso === rangeStart) {
        el.classList.add('ac-selected');
      }

      if (!isPast) {
        el.addEventListener('click', () => pickDay(iso));
      }
      grid.appendChild(el);
    }
  }

  function pickDay(iso) {
    if (activeMode === 'single') {
      rangeStart = iso;
      rangeEnd   = null;
      setInputValue(activeInput, activeHidden, iso);
      render();
      setTimeout(closePicker, 260);
    } else if (activeMode === 'range-start') {
      rangeStart = iso;
      rangeEnd   = null;
      setInputValue(activeInput, activeHidden, iso);
      render();
      // Check if linked picker's input is actually visible (not hidden by trip type toggle)
      const linkedVisible = linkedPicker && linkedPicker.display &&
                            linkedPicker.display.offsetParent !== null &&
                            linkedPicker.display.getBoundingClientRect().width > 0;
      if (linkedVisible) {
        setTimeout(() => {
          openPicker(linkedPicker.display, linkedPicker.hidden, 'range-end');
        }, 280);
      } else {
        setTimeout(closePicker, 260);
      }
    } else { // range-end
      if (rangeStart && iso < rangeStart) {
        // Swap if end is before start
        rangeEnd   = rangeStart;
        rangeStart = iso;
      } else {
        rangeEnd = iso;
      }
      setInputValue(activeInput, activeHidden, iso);
      render();
      setTimeout(closePicker, 260);
    }
  }

  function setInputValue(displayInput, hiddenInput, iso) {
    if (!displayInput) return;
    displayInput.value = formatDisplay(iso);
    if (hiddenInput) hiddenInput.value = iso;
  }

  // ── Open / Close ───────────────────────────────────────────────
  function openPicker(displayInput, hiddenInput, mode, linked) {
    activeInput  = displayInput;
    activeHidden = hiddenInput;
    activeMode   = mode || 'single';
    linkedPicker = linked || null;

    if (mode === 'range-end' && rangeEnd) {
      const parts = rangeEnd.split('-').map(Number);
      state.year = parts[0]; state.month = parts[1]-1;
    } else if (rangeStart) {
      const parts = rangeStart.split('-').map(Number);
      state.year = parts[0]; state.month = parts[1]-1;
    } else {
      const t = today();
      state.year = t.y; state.month = t.m;
    }

    const cal     = document.getElementById('ahlan-cal');
    const overlay = document.getElementById('ahlan-cal-overlay');

    // Always keep calendar in body (position:fixed)
    if (cal.parentElement !== document.body) {
      document.body.appendChild(cal);
    }

    // Measure input BEFORE showing calendar
    const rect = displayInput.getBoundingClientRect();
    const calW = 300;
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;

    // Center horizontally over the input
    let left = rect.left + (rect.width / 2) - (calW / 2);
    left = Math.max(8, Math.min(left, vw - calW - 8));

    // Place below input; flip above if near bottom
    let top = rect.bottom + 6;
    if (top + 380 > vh) top = Math.max(8, rect.top - 386);

    // Lock position with !important via inline style
    cal.setAttribute('style',
      `display:block; position:fixed; z-index:99999; width:${calW}px;` +
      `top:${top}px; left:${left}px;`
    );
    overlay.style.display = 'block';

    render();
  }

  function closePicker(e, doHide) {
    if (doHide === false) return;
    const cal     = document.getElementById('ahlan-cal');
    const overlay = document.getElementById('ahlan-cal-overlay');
    if (cal)     cal.setAttribute('style', 'display:none; position:fixed; z-index:99999;');
    if (overlay) overlay.style.display = 'none';
  }

  function clearPicker() {
    rangeStart = null;
    rangeEnd   = null;
    if (activeInput)  activeInput.value  = '';
    if (activeHidden) activeHidden.value = '';
    render();
  }

  // ── Public init ────────────────────────────────────────────────
  function init() {
    buildPicker();

    // Replace all date inputs with custom pickers
    document.querySelectorAll('input[type="date"], input.ac-date-field').forEach(input => {
      attachToInput(input);
    });
  }

  function attachToInput(input) {
    if (input.dataset.acAttached) return;
    input.dataset.acAttached = '1';

    const mode  = input.dataset.calMode   || 'single';
    const group = input.dataset.calGroup  || null;

    // Create display input
    const display = document.createElement('input');
    display.type        = 'text';
    display.readOnly    = true;
    display.placeholder = input.placeholder || 'Select date';
    display.className   = input.className;
    display.style.cursor = 'pointer';
    display.style.caretColor = 'transparent';

    // Keep original as hidden
    input.type  = 'hidden';
    input.style.display = 'none';
    input.parentNode.insertBefore(display, input);


    display.addEventListener('click', () => {
      let linked = null;
      if (group) {
        const partner = document.querySelector(`input[data-cal-group="${group}"][data-cal-mode="range-end"]`);
        if (partner) {
          const partnerDisplay = partner.previousElementSibling;
          linked = { display: partnerDisplay, hidden: partner };
        }
      }
      openPicker(display, input, mode, linked);
    });

    // Pre-fill if value set
    if (input.value) {
      display.value = formatDisplay(input.value);
    }
  }

  // Expose globally
  global.AhlanCalendar = { init, attachToInput, openPicker };

})(window);
