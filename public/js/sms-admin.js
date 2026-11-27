(() => {
  const drawer = document.getElementById('sms-drawer');
  const eventForm = document.getElementById('sms-event-form');
  let childId;
  let child;

  async function request(path, options) {
    const response = await fetch(path, options);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Unable to complete request.');
    return data;
  }

  async function loadEvents() {
    const list = document.getElementById('sms-event-list');
    try {
      const data = await request('/admin/sms/events');
      document.getElementById('sms-mode').textContent = data.mode === 'live' ? 'Live messaging enabled.' : data.mode === 'dry-run' ? 'Dry-run mode: no texts will be sent.' : 'Messaging is off; no texts will be sent.';
      eventForm.querySelectorAll('input, button').forEach((control) => { control.disabled = data.mode === 'off'; });
      list.replaceChildren();
      const active = data.events.filter((event) => event.enabled);
      if (!active.length) { list.textContent = 'No reminder dates enabled.'; return; }
      active.forEach((event) => {
        const item = document.createElement('div');
        const label = document.createElement('span'); label.textContent = event.event_date;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Disable';
        button.addEventListener('click', async () => { try { await request(`/admin/sms/events/${event.id}`, { method: 'DELETE' }); await loadEvents(); } catch (error) { showToast(error.message, 'error'); } });
        item.append(label, button); list.appendChild(item);
      });
    } catch (error) { document.getElementById('sms-mode').textContent = 'Messaging is unavailable.'; eventForm.querySelectorAll('input, button').forEach((control) => { control.disabled = true; }); }
  }

  if (eventForm) {
    eventForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await request('/admin/sms/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: document.getElementById('sms-event-date').value }) }); await loadEvents(); showToast('Reminder date enabled.'); }
      catch (error) { showToast(error.message, 'error'); }
    });
    loadEvents();
  }

  async function loadDrawer() {
    const data = await request(`/admin/sms/messages/${childId}`);
    child = data.child;
    document.getElementById('sms-recipient').textContent = `${child.first_name} ${child.last_name} · ${child.phone_number}`;
    document.getElementById('sms-drawer-status').textContent = !data.canText ? 'This number has not opted in or has opted out.' : data.mode === 'live' ? 'Texts will be sent through Twilio.' : data.mode === 'dry-run' ? 'Dry-run mode: no texts will be sent.' : 'Messaging is currently off.';
    document.getElementById('sms-send').disabled = !data.canText || data.mode === 'off';
    const assignment = document.getElementById('sms-event-assignment');
    assignment.replaceChildren();
    data.events.forEach((event) => {
      const option = document.createElement('option'); option.value = event.id; option.textContent = `${event.event_date}${event.enrolled ? ' · assigned' : ''}`; assignment.appendChild(option);
    });
    document.getElementById('sms-assign').disabled = !data.events.length;
    const history = document.getElementById('sms-history'); history.replaceChildren();
    if (!data.messages.length) { history.textContent = 'No messages yet.'; return; }
    data.messages.forEach((message) => {
      const item = document.createElement('div'); item.className = 'sms-history-item';
      const body = document.createElement('p'); body.textContent = message.body;
      const status = document.createElement('small'); status.textContent = `${message.kind} · ${message.status} · ${new Date(message.created_at).toLocaleString()}`;
      item.append(body, status); history.appendChild(item);
    });
  }

  if (drawer) {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-open-sms]');
      if (!button) return;
      childId = button.closest('[data-registrant-id]').dataset.registrantId;
      child = null; document.getElementById('sms-message').value = '';
      document.getElementById('sms-recipient').textContent = '';
      document.getElementById('sms-history').textContent = '';
      document.getElementById('sms-drawer-status').textContent = 'Loading…';
      document.getElementById('sms-send').disabled = true;
      drawer.showModal();
      try { await loadDrawer(); } catch (error) { document.getElementById('sms-drawer-status').textContent = error.message; }
    });
    document.getElementById('sms-close').addEventListener('click', () => drawer.close());
    document.getElementById('sms-template').addEventListener('click', () => { if (child) document.getElementById('sms-message').value = `${child.first_name} needs to be picked up from Kidz Quest. Please remember to show your code ${childId} for pickup.`; });
    document.getElementById('sms-assign').addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try { await request(`/admin/sms/events/${document.getElementById('sms-event-assignment').value}/enroll/${childId}`, { method: 'POST' }); await loadDrawer(); showToast('Child assigned to event.'); }
      catch (error) { showToast(error.message, 'error'); button.disabled = false; }
    });
    document.getElementById('sms-send').addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try { await request(`/admin/sms/messages/${childId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: document.getElementById('sms-message').value }) }); document.getElementById('sms-message').value = ''; await loadDrawer(); showToast('Message recorded. Check history for its status.'); }
      catch (error) { showToast(error.message, 'error'); button.disabled = false; }
    });
  }
})();