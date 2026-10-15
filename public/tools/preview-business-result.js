/* Shared entry into the site's printer preview for standalone business tools. */
window.previewBusinessResult = function (title, content) {
  const summary = { title: String(title), content: String(content) };
  // Embedded tools use the existing host in the parent page.
  try {
    if (window.parent !== window && window.parent.location.origin === window.location.origin && window.parent.document.querySelector('[data-pds-preview-host]')) {
      window.parent.dispatchEvent(new window.parent.CustomEvent('prowess-summary', { detail: summary }));
      return;
    }
  } catch { /* A standalone preview also works when the parent is cross-origin. */ }
  const tab = window.open('', '_blank');
  if (!tab) throw new Error('Allow pop-ups to open your print preview, then try again.');
  try {
    tab.sessionStorage.setItem('pds-business-print-preview', JSON.stringify(summary));
    tab.opener = null;
    tab.location.replace('/tools/print-preview');
  } catch {
    tab.close();
    throw new Error('Your browser could not open the preview. Please allow browser storage and try again.');
  }
};
