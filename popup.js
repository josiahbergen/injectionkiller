document.addEventListener('DOMContentLoaded', () => {
  const manualRadio = document.querySelector('input[value="manual"]');
  const pomRadio = document.querySelector('input[value="peaceOfMind"]');
  const status = document.getElementById('status');

  // Load saved setting
  // Note: Firefox supports 'browser' namespace, Chrome uses 'chrome'. 
  // WebExtension polyfills or checking existence is common, but 'browser' works in Firefox natively.
  // For broader compatibility we use chrome.storage.
  const storage = (typeof browser !== 'undefined' ? browser : chrome).storage;

  storage.local.get(['mode'], (result) => {
    if (result.mode === 'manual') {
      manualRadio.checked = true;
    } else {
      pomRadio.checked = true;
    }
  });

  // Save setting on change
  function saveOption(e) {
    const mode = e.target.value;
    storage.local.set({ mode: mode }, () => {

      // Notify active tabs to update their config live
      if (typeof browser !== 'undefined') {
          browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
             if (tabs[0]) browser.tabs.sendMessage(tabs[0].id, {action: "updateSettings", mode: mode});
          });
      } else {
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
             if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, {action: "updateSettings", mode: mode});
          });
      }
    });
  }

  manualRadio.addEventListener('change', saveOption);
  pomRadio.addEventListener('change', saveOption);
});

