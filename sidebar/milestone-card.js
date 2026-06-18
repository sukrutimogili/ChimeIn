export function createMilestoneCard(milestone, index, onApprove, onReject, onDateSet) {
  console.log('card milestone:', milestone);
  const card = document.createElement('div');
  const isConfirmed = milestone.confidence === 'high' && milestone.date;
  card.className = `milestone-card ${isConfirmed ? 'confirmed' : 'missing'}`;
  card.dataset.index = index;

  const formatDate = (dateVal) => dateVal
    ? new Date(dateVal).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'date unclear – tap to set';

  const hackathonPrefix = milestone.eventName
    ? `${milestone.eventName.toLowerCase().replace(/ /g, '_')} / `
    : '';

  const displayName = hackathonPrefix + milestone.name.toLowerCase().replace(/ /g, '_');
 
card.innerHTML = `
    <div class="card-top">
      <span class="card-name">${displayName}</span>
      <span class="card-status ${isConfirmed ? 'confirmed' : 'missing'}">
        ${isConfirmed ? 'CONFIRMED' : 'DATE MISSING'}
      </span>
    </div>
    <div class="card-date">${formatDate(milestone.date)}</div>
    <div class="date-input-row ${isConfirmed ? 'hidden' : ''}">
      <input type="datetime-local" class="date-input" />
    </div>
    <div class="card-actions">
      <button class="btn-approve">APPROVE</button>
      <button class="btn-edit">EDIT</button>
      <button class="btn-reject">✕</button>
    </div>
  `;

  const dateInput = card.querySelector('.date-input');
  const dateDisplay = card.querySelector('.card-date');
  const dateRow = card.querySelector('.date-input-row');

  dateInput.addEventListener('change', (e) => {
    const localDate = new Date(e.target.value);
    milestone.date = localDate.toISOString();
    milestone.confidence = 'high';
    dateDisplay.textContent = formatDate(milestone.date);
    card.className = 'milestone-card confirmed';
    card.querySelector('.card-status').className = 'card-status confirmed';
    card.querySelector('.card-status').textContent = 'CONFIRMED';
    dateRow.classList.add('hidden');
  });

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

    dateRow.classList.toggle('hidden');
    if (!dateRow.classList.contains('hidden')) {
      if (milestone.date) {
        const d = new Date(milestone.date);
        dateInput.value = d.toISOString().slice(0, 16);
      }
      dateInput.focus();
    }

    nameEl.contentEditable = 'true';
    nameEl.focus();
    nameEl.addEventListener('blur', () => {
      nameEl.contentEditable = 'false';
      milestone.name = nameEl.textContent.split(' [')[0].replace(/_/g, ' ');
    }, { once: true });
  });

  return card;
}