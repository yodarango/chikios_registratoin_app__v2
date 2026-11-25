(() => {
  const roster = document.getElementById('registrants-table');
  const search = document.getElementById('search');
  let genderFilter = null;
  let statusFilter = null;

  function updateRoster() {
    if (!roster) return;
    const cards = Array.from(roster.querySelectorAll('[data-registrant-id]'));
    const term = search.value.trim().toLowerCase();
    let visible = 0;
    let checkedIn = 0;

    cards.forEach((card) => {
      const isIn = card.dataset.registrantCheckedIn === 'true';
      if (isIn) checkedIn++;
      const matchesSearch = card.dataset.registrantName.toLowerCase().includes(term) || card.dataset.registrantId.toLowerCase().includes(term);
      const matchesGender = genderFilter === null || card.dataset.registrantGender === genderFilter;
      const matchesStatus = statusFilter === null || card.dataset.registrantCheckedIn === statusFilter;
      card.hidden = !(matchesSearch && matchesGender && matchesStatus);
      if (!card.hidden) visible++;
    });

    document.getElementById('total-count').textContent = cards.length;
    document.getElementById('in-count').textContent = checkedIn;
    document.getElementById('out-count').textContent = cards.length - checkedIn;
    document.getElementById('visible-count').textContent = `${visible} shown`;
    document.getElementById('empty-state').hidden = visible !== 0;
  }

  if (roster) {
    search.addEventListener('input', updateRoster);
    document.querySelectorAll('[data-filter-gender], [data-filter-status]').forEach((button) => {
      button.addEventListener('click', () => {
        const isGender = button.hasAttribute('data-filter-gender');
        const value = isGender ? button.dataset.filterGender : button.dataset.filterStatus;
        if (isGender) genderFilter = genderFilter === value ? null : value;
        else statusFilter = statusFilter === value ? null : value;
        document.querySelectorAll(isGender ? '[data-filter-gender]' : '[data-filter-status]').forEach((item) => {
          item.setAttribute('aria-pressed', String((isGender ? item.dataset.filterGender : item.dataset.filterStatus) === (isGender ? genderFilter : statusFilter)));
        });
        updateRoster();
      });
    });
    updateRoster();
  }

  document.addEventListener('click', async (event) => {
    const statusButton = event.target.closest('[data-status-action]');
    const deleteButton = event.target.closest('[data-delete-action]');
    if (!statusButton && !deleteButton) return;
    const button = statusButton || deleteButton;
    const card = button.closest('[data-registrant-id]');
    if (!card) return;
    const id = card.dataset.registrantId;
    const isIn = card.dataset.registrantCheckedIn === 'true';

    if (deleteButton) {
      button.disabled = true;
      const confirmed = await confirmAction(`Delete the registration for ${card.dataset.registrantName}? This cannot be undone.`, { title: 'Delete registration?', confirmText: 'Delete', danger: true });
      button.disabled = false;
      if (!confirmed) return;
    }
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = statusButton ? 'Updating…' : '…';
    try {
      const path = deleteButton ? `/admin/delete/${encodeURIComponent(id)}` : `/admin/${isIn ? 'check-out' : 'check-in'}/${encodeURIComponent(id)}`;
      const response = await fetch(path, { method: deleteButton ? 'DELETE' : 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error('Request failed');
      if (deleteButton) {
        card.remove();
      } else {
        const nowIn = !isIn;
        card.dataset.registrantCheckedIn = String(nowIn);
        const label = card.querySelector('[data-status-label]');
        label.classList.toggle('is-in', nowIn);
        label.classList.toggle('is-out', !nowIn);
        label.innerHTML = `<span aria-hidden="true"></span>${nowIn ? 'Checked in' : 'Checked out'}`;
        button.classList.toggle('action-in', !nowIn);
        button.classList.toggle('action-out', nowIn);
        button.textContent = nowIn ? 'Check out' : 'Check in';
        button.setAttribute('aria-label', `${button.textContent} ${card.dataset.registrantName}`);
      }
      updateRoster();
    } catch (error) {
      console.error(error);
      button.textContent = originalText;
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();