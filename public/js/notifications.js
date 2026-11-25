(() => {
  const toastRegion = document.createElement('div');
  toastRegion.className = 'toast-region';
  toastRegion.setAttribute('aria-live', 'polite');
  toastRegion.setAttribute('aria-relevant', 'additions');
  document.body.appendChild(toastRegion);

  window.showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type === 'error' ? 'error' : 'info'}`;
    toast.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'error' ? '!' : '✦';

    const text = document.createElement('p');
    text.className = 'toast-message';
    text.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';

    toast.append(icon, text, close);
    toastRegion.appendChild(toast);
    const timer = window.setTimeout(() => toast.remove(), 5000);
    close.addEventListener('click', () => {
      window.clearTimeout(timer);
      toast.remove();
    });
  };

  window.confirmAction = (message, options = {}) => new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('aria-labelledby', 'confirm-dialog-title');
    dialog.setAttribute('aria-describedby', 'confirm-dialog-message');

    const title = document.createElement('h2');
    title.id = 'confirm-dialog-title';
    title.textContent = options.title || 'Just checking';
    const text = document.createElement('p');
    text.id = 'confirm-dialog-message';
    text.textContent = message;
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'confirm-cancel';
    cancel.textContent = 'Cancel';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = options.danger ? 'confirm-accept confirm-accept--danger' : 'confirm-accept';
    accept.textContent = options.confirmText || 'Continue';
    actions.append(cancel, accept);
    dialog.append(title, text, actions);
    document.body.appendChild(dialog);

    cancel.addEventListener('click', () => dialog.close('cancel'));
    accept.addEventListener('click', () => dialog.close('confirm'));
    dialog.addEventListener('close', () => {
      const confirmed = dialog.returnValue === 'confirm';
      dialog.remove();
      resolve(confirmed);
    }, { once: true });
    dialog.showModal();
    cancel.focus();
  });
})();