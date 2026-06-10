export function createMilestoneCard(milestone, index, onApprove, onReject, onDateSet) {
  const card = document.createElement('div');
  const isConfirmed = milestone.confidence === 'high' && milestone.date;
  card.className = `milestone-card ${isConfirmed ? 'confirmed' : 'missing'}`;
  card.dataset.index = index;

  const formattedDate = milestone.date
    ? new Date(milestone.date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'date unclear – tap to set';

  card.innerHTML = `
    <div class="card-top">
      <span class="card-name">${milestone.name.toLowerCase().replace(/ /g, '_')}</span>
      <span class="card-status ${isConfirmed ? 'confirmed' : 'missing'}">
        ${isConfirmed ? 'CONFIRMED' : 'DATE MISSING'}
      </span>
    </div>
    <div class="card-date">${formattedDate}</div>
    ${!isConfirmed ? `
      <div class="date-input-row">
        <input type="datetime-local" class="date-input" />
      </div>
    ` : ''}
    <div class="card-actions">
      <button class="btn-approve">APPROVE</button>
      <button class="btn-edit">EDIT</button>
      <button class="btn-reject">✕</button>
    </div>
  `;

  const dateInput = card.querySelector('.date-input');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
    const localDate = new Date(e.target.value);
    onDateSet(index, localDate.toISOString());
    });
  }

  card.querySelector('.btn-approve').addEventListener('click', () => {
    card.style.opacity = '0.4';
    card.querySelector('.btn-approve').textContent = 'APPROVED';
    onApprove(index);
  });

  card.querySelector('.btn-reject').addEventListener('click', () => {
    card.style.opacity = '0.3';
    card.style.pointerEvents = 'none';
    onReject(index);
  });

  card.querySelector('.btn-edit').addEventListener('click', () => {
    const nameEl = card.querySelector('.card-name');
    const currentName = milestone.name;
    nameEl.contentEditable = 'true';
    nameEl.focus();
    nameEl.addEventListener('blur', () => {
      nameEl.contentEditable = 'false';
      milestone.name = nameEl.textContent;
    }, { once: true });
  });

  return card;
}