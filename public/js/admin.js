(() => {
  const roster = document.getElementById('registrants-table');
  const search = document.getElementById('search');
  let genderFilter = null;
  let statusFilter = null;
  let searchTimer;
  let searchRequest;
  let searchVersion = 0;
  const detail = document.querySelector('.detail-card[data-registrant-id]');

  function updateRoster() {
    if (!roster) return;
    const cards = Array.from(roster.querySelectorAll('[data-registrant-id]'));
    let visible = 0;

    cards.forEach((card) => {
      const matchesGender = genderFilter === null || card.dataset.registrantGender === genderFilter;
      const matchesStatus = statusFilter === null || card.dataset.registrantCheckedIn === statusFilter;
      card.hidden = !(matchesGender && matchesStatus);
      if (!card.hidden) visible++;
    });

    document.getElementById('visible-count').textContent = `${visible} shown`;
    document.getElementById('empty-state').hidden = visible !== 0;
  }

  function createRegistrantCard(registrant) {
    const card = document.createElement('article');
    const name = `${registrant.first_name} ${registrant.last_name}`;
    const isIn = Number(registrant.checked_in) > 0;
    card.className = 'registrant-card';
    card.dataset.registrantId = registrant.id;
    card.dataset.registrantName = name;
    card.dataset.registrantFirstName = registrant.first_name || '';
    card.dataset.guardianPhone = registrant.guardian_phone_number || '';
    card.dataset.registrantGender = registrant.gender;
    card.dataset.registrantCheckedIn = String(isIn);
    card.innerHTML = '<div class="registrant-identity"><span class="registrant-avatar" aria-hidden="true"></span><div class="registrant-info"><a class="registrant-name"></a><p>Age <span data-age></span> <span aria-hidden="true">·</span> Pickup code <strong></strong></p></div></div><div class="registrant-actions"><span class="status-pill" data-status-label><span aria-hidden="true"></span></span><button type="button" class="pickup-action" data-pickup-message title="Open pickup message on your phone">Pickup ↗</button><button type="button" class="message-action" data-open-sms title="Text parent">✉</button><button type="button" class="status-action" data-status-action></button><button type="button" class="delete-action" data-delete-action title="Delete registration">×</button></div>';
    card.querySelector('.registrant-avatar').textContent = (registrant.first_name || '?').charAt(0).toUpperCase();
    const link = card.querySelector('.registrant-name');
    link.href = `/admin/${encodeURIComponent(registrant.id)}`;
    link.textContent = name;
    card.querySelector('[data-age]').textContent = registrant.age;
    card.querySelector('strong').textContent = `#${registrant.id}`;
    const label = card.querySelector('[data-status-label]');
    label.classList.add(isIn ? 'is-in' : 'is-out');
    label.append(document.createTextNode(isIn ? 'Checked in' : 'Checked out'));
    card.querySelector('[data-open-sms]').setAttribute('aria-label', `Text parent of ${name}`);
    card.querySelector('[data-pickup-message]').setAttribute('aria-label', `Open pickup message for ${name}`);
    const action = card.querySelector('[data-status-action]');
    action.classList.add(isIn ? 'action-out' : 'action-in');
    action.textContent = isIn ? 'Check out' : 'Check in';
    action.setAttribute('aria-label', `${action.textContent} ${name}`);
    card.querySelector('[data-delete-action]').setAttribute('aria-label', `Delete ${name}`);
    return card;
  }

  async function searchRoster({ quiet = false } = {}) {
    if (!roster) return;
    const version = ++searchVersion;
    searchRequest?.abort();
    searchRequest = new AbortController();
    try {
      const query = new URLSearchParams({ q: search.value.trim() });
      const response = await fetch(`/admin/search/registrants?${query}`, { signal: searchRequest.signal, cache: 'no-store' });
      if (response.status === 401) throw new Error('Please sign in again.');
      if (!response.ok) throw new Error('Could not search registrations. Please try again.');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Could not search registrations. Please try again.');
      if (version !== searchVersion) return;
      roster.replaceChildren(...result.registrants.map(createRegistrantCard));
      const total = Number(result.counts.total);
      const checkedIn = Number(result.counts.checked_in);
      document.getElementById('total-count').textContent = total;
      document.getElementById('in-count').textContent = checkedIn;
      document.getElementById('out-count').textContent = total - checkedIn;
      updateRoster();
    } catch (error) {
      if (error.name !== 'AbortError' && version === searchVersion) {
        console.error(error);
        if (!quiet) showToast(error.message, 'error');
      }
    }
  }

  function applyStatus(card, nowIn) {
    card.dataset.registrantCheckedIn = String(nowIn);
    const label = card.querySelector('[data-status-label]');
    label.classList.toggle('is-in', nowIn);
    label.classList.toggle('is-out', !nowIn);
    label.innerHTML = `<span aria-hidden="true"></span>${nowIn ? 'Checked in' : 'Checked out'}`;
    const button = card.querySelector('[data-status-action]');
    button.classList.toggle('action-in', !nowIn);
    button.classList.toggle('action-out', nowIn);
    button.textContent = nowIn ? 'Check out' : 'Check in';
    button.setAttribute('aria-label', `${button.textContent} ${card.dataset.registrantName}`);
  }

  let detailVersion = 0;
  async function refreshDetail() {
    if (!detail) return;
    const version = ++detailVersion;
    try {
      const response = await fetch(`/admin/search/registrants?q=${encodeURIComponent(detail.dataset.registrantId)}`, { cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json();
      if (version !== detailVersion || !result.success) return;
      const child = result.registrants.find(item => String(item.id) === detail.dataset.registrantId);
      if (child) applyStatus(detail, Number(child.checked_in) > 0);
      else { detail.querySelector('[data-status-action]').disabled = true; detail.querySelector('[data-status-label]').textContent = 'Registration removed'; }
    } catch (error) { console.error('Could not refresh registration status:', error); }
  }

  let liveTimer;
  function refreshLive() {
    if (document.hidden) return;
    if (roster) { clearTimeout(searchTimer); searchRoster({ quiet: true }); }
    else refreshDetail();
  }
  function scheduleLiveRefresh() { clearTimeout(liveTimer); liveTimer = setTimeout(refreshLive, 100); }
  function connectLive() {
    if (!roster && !detail) return;
    let stream;
    let socket;
    let retry;
    let failureCount = 0;
    const startStream = () => {
      if (stream || !window.EventSource) return;
      stream = new EventSource('/admin/live/events');
      stream.onopen = scheduleLiveRefresh;
      stream.onmessage = (event) => { try { if (JSON.parse(event.data).type === 'roster_changed') scheduleLiveRefresh(); } catch {} };
    };
    const connect = () => {
      if (!window.WebSocket) { startStream(); return; }
      try { socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/admin/live`); }
      catch { startStream(); retry = setTimeout(connect, 30000); return; }
      socket.onopen = () => { failureCount = 0; if (stream) { stream.close(); stream = null; } scheduleLiveRefresh(); };
      socket.onmessage = (event) => { try { if (JSON.parse(event.data).type === 'roster_changed') scheduleLiveRefresh(); } catch {} };
      socket.onerror = () => socket.close();
      socket.onclose = () => { startStream(); failureCount++; retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(failureCount, 5))); };
    };
    connect();
    const poll = setInterval(refreshLive, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleLiveRefresh(); });
    window.addEventListener('pagehide', (event) => { if (event.persisted) return; clearTimeout(retry); clearTimeout(liveTimer); clearInterval(poll); if (socket) { socket.onclose = null; socket.close(); } if (stream) stream.close(); });
  }

  if (roster) {
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchVersion++;
      searchRequest?.abort();
      searchTimer = setTimeout(() => searchRoster(), 250);
    });
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
  connectLive();

  document.addEventListener('click', async (event) => {
    const pickupButton = event.target.closest('[data-pickup-message]');
    if (pickupButton) {
      const card = pickupButton.closest('[data-registrant-id]');
      const raw = (card?.dataset.guardianPhone || '').trim();
      const digits = raw.replace(/\D/g, '');
      if (!/^[+\d\s().-]+$/.test(raw) || (raw.startsWith('+') ? digits.length !== 11 || !digits.startsWith('1') : !(digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))))) {
        showToast('A valid US guardian phone number is required for a pickup message.', 'error');
        return;
      }
      const phone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
      const message = `${card.dataset.registrantFirstName} needs to be picked up from kids quest. do not forget to show their code :${card.dataset.registrantId} at the door`;
      const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      location.href = `sms:${phone}${ios ? '&' : '?'}body=${encodeURIComponent(message)}`;
      return;
    }
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
        applyStatus(card, !isIn);
      }
      if (roster) {
        clearTimeout(searchTimer);
        await searchRoster();
      }
    } catch (error) {
      console.error(error);
      button.textContent = originalText;
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();