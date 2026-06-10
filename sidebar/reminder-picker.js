const REMINDER_OPTIONS = [
  { label: '7 days out', days: [7] },
  { label: '3 days out', days: [3] },
  { label: '1 day out', days: [1] },
  { label: '7, 3, 1 days out', days: [7, 3, 1] },
  { label: 'every day for a week', days: [7, 6, 5, 4, 3, 2, 1] },
  { label: 'custom', days: null },
];

export function openReminderPicker(milestoneName, currentDays, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'reminder-modal-overlay';

  let selected = currentDays;

  const optionsHTML = REMINDER_OPTIONS.map((opt, i) => {
    const isSelected = JSON.stringify(opt.days) === JSON.stringify(currentDays);
    return `
      <div class="reminder-option ${isSelected ? 'selected' : ''}" data-index="${i}">
        <span class="reminder-option-label">${opt.label}</span>
        <div class="reminder-option-check">${isSelected ? '✓' : ''}</div>
      </div>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="reminder-modal">
      <p class="reminder-modal-title">// SET REMINDER — ${milestoneName.toUpperCase()}</p>
      <div class="reminder-options">
        ${optionsHTML}
      </div>
      <div class="reminder-modal-actions">
        <button id="reminder-save">SAVE</button>
        <button id="reminder-cancel">CANCEL</button>
      </div>
    </div>
  `;

  overlay.querySelectorAll('.reminder-option').forEach((el, i) => {
    el.addEventListener('click', () => {
      overlay.querySelectorAll('.reminder-option').forEach(o => {
        o.classList.remove('selected');
        o.querySelector('.reminder-option-check').textContent = '';
      });
      el.classList.add('selected');
      el.querySelector('.reminder-option-check').textContent = '✓';
      selected = REMINDER_OPTIONS[i].days;
    });
  });

  overlay.querySelector('#reminder-save').addEventListener('click', () => {
    if (selected) {
      onSave(selected);
    }
    overlay.remove();
  });

  overlay.querySelector('#reminder-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.body.appendChild(overlay);
}